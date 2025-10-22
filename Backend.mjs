import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import CONFIG from './Config/Config.json' with { type: "json" }; // For Windows
// import CONFIG from './Config/Config.json' assert { type: "json" };   // For Linux
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import mysql from 'mysql2/promise';
import crypto from 'crypto'
import path from 'path';
import { marked } from "marked";
import showdown from "showdown";
import multer from "multer";
import { Jimp } from "jimp";
import imageThumbnail from "image-thumbnail"

const FileUpload = multer({ dest: 'data/TempUploads/' })


const __dirname = path.resolve();

const app = express();

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

app.get('/', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(403).send("You do not have rights to visit this page");
    //res.redirect(`${CONFIG.server}:8080\index.html`)
});

app.listen(CONFIG.NodePort, () => {
    log(`[BOOT] DigitalGarden Started!`,"Service")
    log(`[BOOT] Version: ${CONFIG.version}`,"Service")
    log(`[BOOT] Port: ${CONFIG.NodePort}`,"Service");
    log(`[BOOT] Cors Options: ${JSON.stringify(corsOptions)}`,"Service")
}); 

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit:'1GB'}))

//connect to database
let SQLConnection = await mysql.createConnection({
    host     : CONFIG.SQLServer,
    user     : CONFIG.SQLUser,
    password : CONFIG.SQLPass,
    database : CONFIG.SQLDatabase
});

//check that Database is connected
await SQLConnection.query("SELECT 1").then(result =>{
    if(result[0].length < 1){
        log(`[ERROR] Could not obtain Database Connection!`,"service")
    }else{
        log("[BOOT] Connected to Database!","Service");
    }
})

//set boot time
var BootTime = Date.now()

var $UserSessions = []
//{Username:{User},SessionStart:{DateTime},SessionID={GUID}}

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);


// Code from https://stackoverflow.com/questions/60369148/how-do-i-replace-deprecated-crypto-createcipher-in-node-js
function encrypt(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(CONFIG.DecryptKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(CONFIG.DecryptKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Code From End

// Timer Jobs
PurgeEmptyDrafts()
function PurgeEmptyDrafts(){

    //get all drafts
    SqlQuery(`SELECT ID FROM digitalgarden.posts WHERE Stage = "DRAFT"`).then(result =>{
        result.forEach(draft => {
            if(!fs.existsSync(`${__dirname}\\data\\POSTS\\${draft.ID}\\post.md`)){
                //if the post.md file dosnt exist delete the folder
                var sql = `DELETE FROM DigitalGarden.posts WHERE ID = '${draft.ID}'`
                SqlQuery(sql).then(result =>{
                    if(result.affectedRows > 0){
                        //file was removed from DB
                        //delete folder from server
                        fs.rmSync(`${__dirname}\\data\\POSTS\\${draft.ID}`, { recursive: true, force: true });
                        log(`[INFO] Deleted Empty Draft ${draft.ID}`,"service")
                    }else{ 
                        log(`[ERROR] There was an error deleting empty Draft ${draft.ID}`,"service")
                    }
                })
            }
        });
    })

    //set to run again
    setTimeout(PurgeEmptyDrafts,3600000)
}

// Requests

app.get('/Uptime',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');

    var now = Date.now()
    var timeDif = now - BootTime
    res.send({uptime:timeDif,lastBoot:BootTime}) 
});

app.post('/Restart',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');

    
    var AdminSessionID = req.body.AdminSessionID
    if(AdminSessionID == undefined){
        res.send({"success":false,"error":"No User Session sent"})
    }

    //check user is an admin
    var user = IsUserSessionValid(AdminSessionID)

    if(user.Group == "ADMIN"){
        //terminate script
        log(`[Server Manager] Restart Called by ${user.Username}`,"Service")

        setTimeout(process.exit(),2000)

        res.send({"success":true})
        
    }else{
        res.send({"success":false,"error":"User Not an admin"})
    }
});

app.get('/Status',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    res.send(true)
});


app.post('/NewUser', (req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.body == null) {
        // if post is missing body
        res.status(400).send({"error":true,msg:"missing POST body!"});
        return;
    }
    
   try{

        //assign all req values
        var Username = req.body.username
        var Password = req.body.password
        var InviteKey = req.body.InviteKey
        var UserData = `{
            "Alias":"${Username}",
            "Subtext":"",
            "ProNouns":"",
            "Links":[],
            "Bio":""
        } `

        //check invite key is valid
        var sqlInviteKey = `SELECT * FROM DigitalGarden.invite_tokens WHERE ID = '${InviteKey}' AND date(Experation) > NOW()`
        var sqlExistingUser = `SELECT COUNT(ID) AS users FROM DigitalGarden.users WHERE UPPER(Username) = '${Username.toUpperCase()}'`
        const allPromise = Promise.all([SqlQuery(sqlInviteKey),SqlQuery(sqlExistingUser)])
        allPromise.then(result  =>{
            
            const InviteKeyRes = result[0]
            const ExistingUsers = result[1][0]

            if(ExistingUsers.users > 0){
                //there is already an existing user with this username
                res.status(400).send({"error":true,msg:`The username ${Username} is already taken!`})
                return;
            }

            if(InviteKeyRes[0].ID == InviteKey){
                //encrypt password
                var encrypted = encrypt(Password);
                //add user record to DB
                var sql = `INSERT INTO users (ID, Username, UserData, Passkey, InviteKey) VALUES ((SELECT UUID() AS ID), '${Username}', '${UserData}', '${JSON.stringify(encrypted)}' ,'${InviteKeyRes[0].ID}');`
                SqlQuery(sql).then(result =>{
                    // TODO validate result
                    if(result.affectedRows > 0){
                        // Send user confirmation
                        res.status(200).send({"error":false})

                    }else{
                        var tracker = uuidv4()
                        log(`[ERROR] [${tracker}] There was a SQL error adding user - ${JSON.stringify(result, null, 2)}`,"Service");
                        res.status(500).send({"error":true,"msg":"There was an issue adding a user to the DB","tracker":tracker})
                    }
                    
                    
                }).catch(err => {
                    //there was an issue adding the user
                    var tracker = uuidv4()
                    log(`[ERROR] [${tracker}] Cannot adding user to DB- ${JSON.stringify(err, null, 2)}`,"Service");
                    res.status(500).send({"error":true,"msg":"There was an issue adding a user to the DB","tracker":tracker})
                });
                
            }else{
                //key is invalid or has expired
                res.status(401).send({"error":true,"msg":"Invite key is invalid or has expired!"})
            }
        }).catch(err => {
            //there was a server error getting the invite key
            var tracker = uuidv4()
            log(`[ERROR] [${tracker}] Cannot get invite key from DB - ${JSON.stringify(err, null, 2)}`,"Service");
            res.status(500).send({"error":true,"msg":"Cannot get invite key from DB","tracker":tracker})
        });
        
    }catch(err){
        res.status(500).send({"error":true,"msg":err})
        return;
    }

});

app.post("/Login",(req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":true, msg:"Missing query"});
        return;
    }

    var Username = req.body.username
    var Password = req.body.password

    if(Username ==  undefined || Password ==  undefined){
        res.status(400).send({"error":true,"msg":"Missing username or password!"})
    }

    try{
        var sql = `SELECT * FROM DigitalGarden.users WHERE UPPER(Username) = '${Username}'`
        SqlQuery(sql).then(result =>{

            if(result.length == 0){
                // user not found
                res.status(401).send({"error":true,"msg":"Username or password is incorrect"})
                return;
            }

            var UserData = result[0]  
            var ServerPass = decrypt(JSON.parse(UserData.Passkey))
       

            if(Password == ServerPass){
                
                //remove any cloned sessions
                $UserSessions.map((UserSession) =>{
                    try{
                        if(UserSession.Username === Username){
                            removeUserSession(UserSession.SessionID)
                        }  
                    }catch{}                 
                })   

                // login user
                var sessionID = uuidv4()
                var sessionStart = Date.now()
                var SessionVar = {ID:UserData.ID,Username:UserData.Username,SessionStart:sessionStart,SessionID:sessionID,Permission:UserData.Permission}

                $UserSessions.push(SessionVar)

                log(`[INFO] User ${UserData.Username} logged in successfully`,"Service")

                res.status(200).send({"error":false,"loginSession":{Username:UserData.Username,SessionStart:sessionStart,SessionID:sessionID,Permission:UserData.Permission}})



            }else{
                // password is incorrect
                log(`[INFO] User ${UserData.Username}failed to login`,"Service")
                res.status(401).send({"error":true,"msg":"Username or password is incorrect"})
            }
        })

    }catch(err){

    }
});

app.get('/CreateInvite',(req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.query == null) {
        res.status(400).send({"error":true, msg:"Missing query"});
        return;
    }

    var User = IsUserSessionValid(req.query.SessionID)
    if(User.login){
        var Key = uuidv4()
        var sql = `INSERT INTO DigitalGarden.invite_tokens (ID,Experation,CreatedBy)VALUES('${Key}',NOW() + INTERVAL 3 DAY,'${User.UserID}')`
        SqlQuery(sql).then(result => {
            
            res.send({"error":false,"InviteLink":`http://${CONFIG.NodeServer}/Register.html?key=${Key}`})
        })

    }else{
        res.status(403).send({"error":true,"msg":"User Session is not valid!"})
    }
})

app.post('/ActiveSessions',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    try{
        // to be turned back on
        // var AdminSessionID = req.body.AdminSessionID
        // var adminAccount = IsUserSessionValid(AdminSessionID)

        // if(adminAccount.Group == "ADMIN"){
        //     res.send($UserSessions)
        // }
        // else{
        //     res.status(500).send({error:true,msg:"User not an admin"})
        // }

        res.send($UserSessions)

    }catch(err){
        log(`[ERROR] /ActiveSessions`, "service", JSON.stringify(err))
        res.status(500).send({error:true,msg:err})
    }
});

app.get('/WelcomeMessage', (req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    var WelcomeFile = `${__dirname}\\data\\WelcomeMessage.txt`

    if(!fs.existsSync(WelcomeFile)){
        fs.writeFile(WelcomeFile,CONFIG.Default_Welcome_Message, err => {
            if (err) {
                log(`${formattedDate} [ERROR] Writing Welcome Message File: ${err}`, "service");
            }
        });
    }

    //read pos file
    fs.readFile(WelcomeFile, 'utf8', (err, data) => {
        if (err) {
            log(`[ERROR] Error reading file: ${err}`, "service");
            return;
        }
        res.send(data)
    })
})

app.post('/ModifyWelcomeMessage', (req,res) => {

    res.set('Access-Control-Allow-Origin', '*');
    
    try{
        var AdminSessionID = req.body.AdminSessionID
        var adminAccount = IsUserSessionValid(AdminSessionID)
        
        //check user is an admin
        if(adminAccount.Group == "ADMIN"){

            var WelcomeFile = `${__dirname}\\data\\WelcomeMessage.txt`
            var message = req.body.text

            fs.writeFile(WelcomeFile,message, err => {
                if (err) {
                    console.log(`${formattedDate} [ERROR] ${err}`);
                    res.status(500).send({error:true,msg:err})
                }else{
                    res.send({error:false})
                }
            });

        }else{

            log(`[ERROR] /ModifyWelcomeMessage insufficient privileges`, "service")
            res.status(500).send({error:true,msg:"User not an admin"})
        }
    }catch(err){

        log(`[ERROR] /ModifyWelcomeMessage`, "service", JSON.stringify(err))
        res.status(500).send({error:true,msg:err})
    }


})  

app.post('/NewDraft',(req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":true, msg:"Missing query"});
        return;
    }
    
    const date = new Date();
    var formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    //check if user session is valid
    var userSession = IsUserSessionValid(req.body.SessionID)
    //if login is invalid 
    if(!userSession.login){
        res.status(401).send({"error":true,"msg":userSession.error})
        return
    }

    try{
        var DraftID = req.body.DraftID
        //check value is a guid
        const regex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
        if(!regex.test(DraftID)){
            res.status(400).send({"error":true,msg:"Draft ID is not a valid GUID"})
        }

        // TODO check that GUID isn't already in use

    }catch{
        var DraftID = uuidv4()
    }
    
    var Draft = {
        ID:DraftID,
        Created:formattedDate,
        Modified:formattedDate,
        Author:userSession.UserID
    }

    var sql = `INSERT INTO posts (ID,PostData,Stage,UserID)VALUES('${Draft.ID}','${JSON.stringify(Draft)}','DRAFT','${Draft.Author}')`
        
    const allPromise = Promise.all([createFolder(),SqlQuery(sql)])
    allPromise.then(result  =>{
        if(result[1].affectedRows > 0){
            // both ran successfully
            res.status(200).send(Draft)
        }else{
            // there was an error
            res.status(500).send({"error":true,msg:result})
        }
    });

    async function createFolder(){
        //create folder for Draft
        try{
            return await fs.mkdirSync(`${__dirname}\\data\\POSTS\\${Draft.ID}`)
        }
        catch(err){
            log(`[ERROR] creating new draft folder ${Draft.ID} - ${JSON.stringify(err)}`,"service")
            return err
        }

    }
});

app.post('/ModifyDraft', (req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":"Missing query"});
        return;
    }

    var PostID = req.body.PostID
    var SessionID = req.body.SessionID
    var PostText = req.body.PostText


    var userSession = IsUserSessionValid(SessionID)
    //if login is invalid 
    if(!userSession.login){
        res.status(401).send({"error":true,"msg":userSession.error})
        return
    }

    //get draft details
    var sql = `SELECT * FROM posts WHERE ID = '${PostID}'`
    SqlQuery(sql).then(result => {
        
        //result is an array of one
        result = result[0]
        
        //no post found
        if(result.length == 0){
            //no post exists with given ID
            res.status(404).send({"error":true,"msg":"Post not found!"})
        }

        // check that user is the one who created the draft
        if(result.UserID == userSession.UserID){
            // check if post it modifiable
            if(result.Stage == "DRAFT"){
                // Allow post ot be modified
                var postData = JSON.parse(result.PostData)
                postData.Modified = Date.now()  

                //update DB
                sql = `UPDATE posts SET postData = '${JSON.stringify(postData)}' WHERE ID = '${PostID}'`
                SqlQuery(sql)

                // Update or create MD file
                try{
                    fs.writeFileSync(`${__dirname}/data/POSTS/${PostID}/post.md`,PostText,{encoding:'utf8',flag:'w'})

                    log(`[INFO] Draft ${PostID} Modified successfully by ${userSession.UserID}`,"status")
                    res.status(200).send({"error":false,msg:"Draft Updated!"})

                }catch(err){
                    log(`[ERROR] Editing Draft ${PostID} - ${err}`,"status")
                    res.status(500).send({"error":false,msg:err})
                }
            }
            else{
                // post cannot be modified
                res.status(403).send({"error":true, "msg":"Post is no longer modifiable!"})
            }
        }
        else{
            //user is not valid
            log(`[ERROR] an attempt was made by ${JSON.stringify(userSession)} to modify a draft that they do not own. Draft ID ${PostID}`,"status")
            res.status(403).send({"error":true,"msg":"You do not have permissions to edit this post"})
        }
    })
        



})

app.get('/GetPostMD', (req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    

    if (req.query == null) {
        res.status(400).send({"error":"Missing query"});
        return;
    }
    var postText = fs.readFileSync(`${__dirname}\\data\\POSTS\\${req.query.PostID}\\post.md`)
    let converter = new showdown.Converter(),
    html = converter.makeHtml(postText);
    res.status(200).send(html);

})

app.post('/GetPost', (req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":"Missing query"});
        return;
    }

    var PostID = req.body.PostID
    var UserSessionID = req.body.SessionID

    //get post from database
    var sql = `SELECT posts.*, users.UserData, users.Username FROM DigitalGarden.posts, DigitalGarden.users WHERE posts.ID = '${PostID}' AND posts.UserID = users.ID`
    SqlQuery(sql).then(result =>{
        
        // Result validation
        try{
            if(result[0].ID != undefined){

                //if the post is a draft the only user that should be able to access it is the user who owns the post
                // if the user is a guest and not logged in they wont have access to any drafts anyway.
                
                if(UserSessionID == undefined && result[0].Stage == "DRAFT"){
                    log(`[INFO] Attempt made to access draft ${result[0].ID} by unknown user`,"service")
                    res.status(403).send({"error":true,"msg":"You do not have access to this draft, this access attempt has been logged"})
                }else{
                    //check if logged user has access to draft
                    var userSession = IsUserSessionValid(UserSessionID)
                    if(userSession.UserID != result[0].UserID && result[0].Stage == "DRAFT"){
                        //refuse request if logged user is not the owner of the draft
                        log(`[INFO] Attempt made to access draft ${result[0].ID} by ${userSession.Username}`,"service")
                        res.status(403).send({"error":true,"msg":"You do not have access to this draft, this access attempt has been logged"})
                    }
                }

                //read post MD
                try{
                    var postText = fs.readFileSync(`${__dirname}\\data\\POSTS\\${PostID}\\post.md`)
                    let converter = new showdown.Converter(),
                    Posthtml = converter.makeHtml(postText.toString());

                    //send post data
                    res.status(200).send({
                        posted:result[0].Posted,
                        Username:result[0].Username,
                        UserData:result[0].UserData,
                        PostData:result[0].PostData,
                        PostText:Posthtml,
                        PostHtml:Posthtml,
                        Stage:result[0].Stage
                    })

                }catch(err){
                    res.status(500).send({"error":true,"msg":"Cannot Read post md file","result":err})
                }
                
            }
        }catch(err){
            res.status(500).send({"error":true,"msg":"Cannot get post from database","result":result,"Err":err})
        }
    });
})

app.post('/PostDraft', (req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":"Missing query"});
        return;
    }
    
    var PostID = req.body.PostID
    var UserSessionID = req.body.SessionID

    //get post from database
    var sql = `SELECT * FROM DigitalGarden.posts WHERE ID = '${PostID}'`
    SqlQuery(sql).then(result =>{
        try{
            if(result[0].ID != undefined){

                //if the post is a draft the only user that should be able to access it is the user who owns the post
                // if the user is a guest and not logged in they wont have access to any drafts anyway.
                
                if(UserSessionID == undefined && result[0].Stage == "DRAFT"){
                    log(`[INFO] Attempt made to access draft ${result[0].ID} by unknown user`,"service")
                    res.status(403).send({"error":true,"msg":"You do not have access to this draft, this access attempt has been logged"})
                }else{
                    //check if logged user has access to draft
                    var userSession = IsUserSessionValid(UserSessionID)
                    if(userSession.UserID != result[0].UserID && result[0].Stage == "DRAFT"){
                        //refuse request if logged user is not the owner of the draft
                        log(`[INFO] Attempt made to access draft ${result[0].ID} by ${userSession.Username}`,"service")
                        res.status(403).send({"error":true,"msg":"You do not have access to this draft, this access attempt has been logged"})
                    }
                }

                //change post stage to POST
                var sql = `UPDATE DigitalGarden.posts SET Stage = "LIVE", Posted = NOW() WHERE ID = "${PostID}"`
                SqlQuery(sql).then(result =>{ 
                    if(result.affectedRows > 0){
                        res.status(200).send({"error":false,msg:"Message updated to post"})
                    }
                    else{
                        res.status(500).send({"error":true,msg:JSON.stringify(result)})
                    }
                })

                // move post directory to LIVE


            }
        }catch(err){
            res.status(500).send({"error":true,"msg":"Cannot get post from database","result":result,"Err":err})
        }
    });
});

app.post('/DeletePost',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":"Missing query"});
        return;
    }

    //get user
    var User = IsUserSessionValid(req.body.SessionID)
    
    if(!User.login){
        res.status(403).send({"error":true,"msg":"User session not valid"})
        return;
    }else{
        var PostID = req.body.PostID
        var sql = `DELETE FROM DigitalGarden.posts WHERE UserID = '${User.UserID}' AND ID = '${PostID}'`
        SqlQuery(sql).then(result =>{
            if(!result.hasOwnProperty("errno")){
                //file was removed from DB
                //delete folder from server
                fs.rmSync(`${__dirname}\\data\\POSTS\\${PostID}`, { recursive: true, force: true });
                res.status(200).send({"error":false,"msg":"Post Deleted"})
            }else{
                res.status(500).send({"error":true,"msg":"Either post missing or User session is incorrect","result":result})
            }
        })
    }   
})

app.post('/GetFeed', (req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":"Missing query"});
        return;
    }

    var pos = req.body.pos
    if(pos == undefined){
        pos = 0
    }

    var sql = `SELECT posts.ID, posts.PostData, posts.Stage, users.Username, users.UserData, posts.posted FROM DigitalGarden.posts, DigitalGarden.users WHERE Stage = "LIVE" AND users.ID = posts.UserID ORDER BY posts.posted DESC LIMIT ${pos}, ${CONFIG.PostGetLimit};`   
    SqlQuery(sql).then(result => {

        result = result.map(e=>{
            var postText = fs.readFileSync(`${__dirname}/data/POSTS/${e.ID}/post.md`)
            let converter = new showdown.Converter(),
            Posthtml = converter.makeHtml(postText.toString());
            e["PostHtml"] = Posthtml

            return e

        })
        res.send(
            {
                posts:result,
                PostGetLimit:CONFIG.PostGetLimit
            }
        )
    })

})

app.post('/GetFeedByUser', (req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":"Missing query"});
        return;
    }

    var pos = req.body.pos
    if(pos == undefined){
        pos = 0
    }
        
    try{
        var sql = `SELECT posts.ID, posts.PostData, posts.Stage, users.Username, users.UserData, posts.posted FROM DigitalGarden.posts, DigitalGarden.users WHERE Stage = "LIVE" AND users.ID = posts.UserID and users.Username = '${req.body.UserID}' ORDER BY posts.posted DESC LIMIT ${pos}, ${CONFIG.PostGetLimit};`   
        SqlQuery(sql).then(result => {

            var posts = result.map(e=>{
                var postText = fs.readFileSync(`${__dirname}/data/POSTS/${e.ID}/post.md`)
                let converter = new showdown.Converter(),
                Posthtml = converter.makeHtml(postText.toString());
                e["PostHtml"] = Posthtml

                return e

            })

            var sql = `SELECT Username, ID, UserData FROM DigitalGarden.users WHERE Username = '${req.body.UserID}'`

            SqlQuery(sql).then(result => {
                //should only be one result so no need to worry about potentially sending the data twice
                var data = result[0]

                if(data != undefined){
                    res.send(
                    {
                        userID:data.ID,
                        userInfo:JSON.parse(data.UserData),
                        posts:posts,
                        PostGetLimit:CONFIG.PostGetLimit
                    })
                }else{
                     res.status(500).send({"error":true,"msg":"Something went wrong!"})
                }
            })
        })
    }catch(err){
        res.status(500).send({"error":true,"msg":err})
    }
})

app.post('/GetDrafts', (req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.status(400).send({"error":"Missing query"});
        return;
    }

    var pos = req.body.pos
    if(pos == undefined){
        pos = 0
    }

    var user = IsUserSessionValid(req.body.SessionID)
    console.log(user)
    if(!user.login){
        res.status(403).send({"error":true,"msg":"User Session is not valid!"})
        return;
    }
        
    try{
        var sql = `SELECT posts.ID, posts.PostData, posts.Stage, users.Username, users.UserData, posts.posted FROM DigitalGarden.posts, DigitalGarden.users WHERE Stage = "DRAFT" AND users.ID = posts.UserID and users.ID = '${user.UserID}' ORDER BY posts.posted DESC LIMIT ${pos}, ${CONFIG.PostGetLimit};`   
        SqlQuery(sql).then(result => {

            var posts = result.map(e=>{
                if(fs.existsSync(`${__dirname}/data/POSTS/${e.ID}/post.md`)){
                    var postText = fs.readFileSync(`${__dirname}/data/POSTS/${e.ID}/post.md`)
                    let converter = new showdown.Converter(),
                    Posthtml = converter.makeHtml(postText.toString());
                    e["PostHtml"] = Posthtml
                }else{
                     e["PostHtml"] = ""
                }
                return e

            })

            var sql = `SELECT Username, ID, UserData FROM DigitalGarden.users WHERE ID = '${user.UserID}'`

            SqlQuery(sql).then(result => {
                //should only be one result so no need to worry about potentially sending the data twice
                var data = result[0]

                if(data != undefined){
                    res.send(
                    {
                        userID:data.ID,
                        userInfo:JSON.parse(data.UserData),
                        posts:posts,
                        PostGetLimit:CONFIG.PostGetLimit
                    })
                }else{
                     res.status(500).send({"error":true,"msg":"Something went wrong!"})
                }
            })
        })
    }catch(err){
        res.status(500).send({"error":true,"msg":err})
    }

})




app.post('/checkLogin',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {

        res.send({"error":"Missing query"});
        return;
    }
    try{
        res.send(IsUserSessionValid(req.body.SessionID))

    }catch(err){
        log(` [ERROR] Error validating user session: `, "service", JSON.stringify(err, null, 2))
        res.send({"valid":false,"error":JSON.stringify(err, null, 2)})
    }

});

app.post('/GetUserDetails',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.send({"error":"Missing query"});
        return;
    }
    
    if(req.body.hasOwnProperty("SessionID")){
        var temp = $UserSessions.find(obj => {
            return obj.SessionID === req.body.SessionID
        })
        var UserID = temp.ID

    }else{
        var UserID = req.body.UserID
    }
    console.log(UserID)
    
    var sql = `SELECT Username, UserData FROM DigitalGarden.users WHERE ID = '${UserID}'`

    SqlQuery(sql).then(result => {
        //should only be one result so no need to worry about potentially sending the data twice
        var data = result[0]
        data.UserData = JSON.parse(data.UserData)

        res.status(200).send(data)
    })

});

app.post('/UserModification',FileUpload.single("UserIcon"),(req,res)=>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.send({"error":"Missing query"});
        return;
    }

    var UserID = IsUserSessionValid(req.body.UserID)
    //save user icon to server if on is attached
    if(req.file != undefined){
        if (!fs.existsSync(`${__dirname}/data/UserIcons/${UserID.UserID}`)){
            fs.mkdirSync(`${__dirname}/data/UserIcons/${UserID.UserID}`);
        }

        ProcessImage(req.file,`${__dirname}/data/UserIcons/${UserID.UserID}`,"UserIcon")
    }
    //save user changes to database

    //filter out unneeded info from links
    var UserLinks = JSON.parse(req.body.UserLinks)
    UserLinks = UserLinks.map((e)=>{
        return {"Title":e.Title,"Username":e.Username,"Link":e.Link}
    })

    if(req.body.Pronouns == "Other"){
        var Pronouns = req.body.OptionalPronoun
    }else{
        var Pronouns = req.body.Pronouns
    }

    var UserData = {
        "Alias":req.body.Alias,
        "Subtext":req.body.Subtext,
        "ProNouns":Pronouns,
        "Links":UserLinks,
        "Bio":req.body.Bio
    }

    var sql = `UPDATE digitalgarden.users SET UserData = '${JSON.stringify(UserData)}' WHERE ID = '${UserID.UserID}'`
    SqlQuery(sql)

    res.send({"error":false,"msg":"User profile updated"})

});


app.post('/SetUserBackground',FileUpload.single("BackgroundImage"),(req,res)=>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.send({"error":"Missing query"});
        return;
    }

    var UserID = IsUserSessionValid(req.body.SessionID)
    //save user icon to server if on is attached
    console.log(req.file)
    if(req.file != undefined){
        if (!fs.existsSync(`${__dirname}/data/UserIcons/${UserID.UserID}`)){
            fs.mkdirSync(`${__dirname}/data/UserIcons/${UserID.UserID}`);
        }
        try{
            ProcessImage(req.file,`${__dirname}/data/UserIcons/${UserID.UserID}`,"UserBackground")

            res.send({"error":false,"msg":"User Background updated"})
        }catch(err){
             res.send({"error":true,"msg":err})
        }       
    }else{
        res.send({"error":true,"msg":"Missing File"})
    }
});

app.get('/GetUserBackground',(req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.query == null) {
        res.send({"error":"Missing query"});
        return;
    }

    if(req.query.SessionID){
        var user = IsUserSessionValid(req.query.SessionID)
        //check that user icon exists else send default
        if (fs.existsSync(`${__dirname}/data/UserIcons/${user.UserID}/UserBackground.png`)){
            res.sendFile(`${__dirname}/data/UserIcons/${user.UserID}/UserBackground.png`)
        }else
        {
            res.status(404)
        }
    }
    else if(req.query.UserID){
        var UserID = req.query.UserID
        if (fs.existsSync(`${__dirname}/data/UserIcons/${UserID}/UserBackground.png`)){
            res.sendFile(`${__dirname}/data/UserIcons/${UserID}/UserBackground.png`)
        }else
        {
            res.status(404)
        }
    }else if(req.query.Username){

        var sql = `SELECT ID FROM digitalgarden.users WHERE Username = '${req.query.Username}'`
        SqlQuery(sql).then(result => {
            if(result.length > 0){
                res.sendFile(`${__dirname}/data/UserIcons/${result[0].ID}/UserBackground.png`)
            }else{
                res.status(404)
            }
           
        })

    }else{
        res.status(404)
    }
})

app.get('/GetUserPfp',(req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.query == null) {
        res.send({"error":"Missing query"});
        return;
    }

    if(req.query.SessionID){
        var user = IsUserSessionValid(req.query.SessionID)
        //check that user icon exists else send default
        if (fs.existsSync(`${__dirname}/data/UserIcons/${user.UserID}/UserIcon.png`)){
            res.sendFile(`${__dirname}/data/UserIcons/${user.UserID}/UserIcon.png`)
        }else
        {
            res.sendFile(`${__dirname}/Webfront/Style/Images/DefaultUserProfile.png`)
        }
    }
    else if(req.query.UserID){
        var UserID = req.query.UserID
        if (fs.existsSync(`${__dirname}/data/UserIcons/${UserID}/UserIcon.png`)){
            res.sendFile(`${__dirname}/data/UserIcons/${UserID}/UserIcon.png`)
        }else
        {
            res.sendFile(`${__dirname}/Webfront/Style/Images/DefaultUserProfile.png`)
        }
    }else{
        res.sendFile(`${__dirname}/Webfront/Style/Images/DefaultUserProfile.png`)

    }
})

app.post('/AddImageToPost',FileUpload.single("Image"),(req,res) => {
     res.set('Access-Control-Allow-Origin', '*');
    if (req.body == null) {
        res.send({"error":"Missing query"});
        return;
    }

    try{
        var PostID = req.body.PostID
        console.log(PostID)
        if(PostID == undefined || PostID == ""){
            res.status(402).send({"error":true,"msg":"Missing Post ID"})
            return
        }

        if(req.file != undefined){
            if (!fs.existsSync(`${__dirname}/data/POSTS/${PostID}/Images`)){
                fs.mkdirSync(`${__dirname}/data/POSTS/${PostID}/Images`);
            }
            ProcessImage(req.file,`${__dirname}/data/POSTS/${PostID}/Images`,uuidv4())
            res.status(200).send({"error":false,"msg":"Img Uploaded"})
        }else{
            res.status(400).send({"error":true,"msg":"Missing File!"})
        }
    }catch(err){
        res.status(500).send({"error":true,"msg":err})
    }
})

app.get('/GetImagesInPost',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.query == null) {
        res.send({"error":"Missing query"});
        return;
    }

    try{
        var PostID = req.query.PostID
        var Images = fs.readdirSync(`${__dirname}/data/POSTS/${PostID}/Images`);
        Images = Images.map(function(e){
            return `/data/POSTS/${PostID}/Images/${e}`
        })
        res.send(Images)

    }catch(err){
        res.status(500).send({"error":true,"msg":err})
    }
})

app.get('/GetImageThumbnail',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.query == null) {
        res.send({"error":"Missing query"});
        return;
    }

    try{
        var FilePath = `${__dirname}\\${req.query.ImgUrl}`
        console.log(FilePath)
        if(fs.existsSync(FilePath)){
            CreateThumb(FilePath).then(thumb => {
                console.log(thumb)
                res.send(thumb)
            })
        }else{
            res.status(404).send({"error":true,"msg":"File Not Found!"})
        }
        
        async function CreateThumb(FilePath) {
            var options = {height:100,withMetaData:true}
            return await imageThumbnail(FilePath,options)
        }

    }catch(err){
        res.status(500).send({"error":true,"msg":err})
    }

})

app.get('/GetImage',(req,res) =>{
    res.set('Access-Control-Allow-Origin', '*');
    if (req.query == null) {
        res.send({"error":"Missing query"});
        return;
    }

    try{
        var FilePath = `${__dirname}\\${req.query.ImgUrl}`
        res.sendFile(FilePath)
        

    }catch(err){
        res.status(500).send({"error":true,"msg":err})
    }

    async function CreateThumb(FilePath) {
        return await imageThumbnail(FilePath)
    }
})



function ProcessImage(File,TargetDropOff,NewName){
    console.log(File)
    //add file extension to file
    var FilePath = `${File.path}.${File.mimetype.replace("image/","")}`
    fs.rename(
        File.path,
        FilePath,
        () => {
            //read image into Jimp
            if(File.mimetype == 'image/png'){
                //move file to destination
                fs.rename(FilePath,`${TargetDropOff}/${NewName}.png`,function (err) {
                    if (err){
                        log(`[ERROR] Couldn't move Image err : ${err}`,"service")
                    }
                })
            }else{
                //convert file to png
                Jimp.read(FilePath).then(image => {
                    try{
                        image.write(`${TargetDropOff}/${NewName}.png`,{format:'png'})
                        fs.unlinkSync(FilePath);

                    }catch(err){
                        log(`[ERROR] Couldn't write Image err : ${err}`,"service")

                    } 
                    
                }) .catch(err => {
                    log(`[ERROR] Couldn't convert Image err : ${err}`,"service")
                });
            }
        }
    )  
}



function IsUserSessionValid(LoginSession){
    var result = $UserSessions.find(obj => {
        return obj.SessionID === LoginSession
    })

    if(result){

        //twelve days
        var expirationDate = Date(Date(result.sessionStart) + (12*24*60*60*100))

        if(expirationDate < Date.now() && !result.StayLoggedIn){
            //session has expired

            //remove from sessions array
            removeUserSession(LoginSession)

            return {"login":false,"error":"Session has timed out"}
        }

        //even keep logged in users will expire, this uses the UserLoginMaxAgeDays setting
        expirationDate = Date(Date(result.sessionStart) + (CONFIG.UserLoginMaxAgeDays*24*60*60*100))

        if(expirationDate < Date.now()){
            //session has expired

            //remove from sessions array
            removeUserSession(LoginSession)

            return {"login":false,"error":"Session has timed out"}
        }
        
        //update last active time
        $UserSessions = $UserSessions.map((UserSession) =>{

            if(UserSession.SessionID === LoginSession){
                return {
                    ...UserSession,
                    LastActive:getDate()
                };
            }

            return UserSession
        })

        //send confirmation
        return {"login":true,"Username":result.Username,"UserID":result.ID,"Permission":result.Permission}
        
    }else{
        return {"login":false,"error":"No User Session Found"}
    }
}


function removeUserSession(SessionID){
    
    var output = "No session Found"

    $UserSessions= $UserSessions.filter(function (UserSession) {
        if(UserSession.SessionID != SessionID){
            return UserSession
        }
        else{
            log(`[INFO] Removing user session ${SessionID}`,"Service")
            output = "Session Removed"
        }
    });    

    return {msg:output}
}



async function SqlQuery(query) {

    //log request to log file
    if(query.length < 500){
        log(` [INFO] SQL REQUEST - ${query.replace('\n','')}`, "SQL")
    }else{
        log(` [INFO] SQL REQUEST - QUERY ABOVE 500 Char, snipping for log size - ${query.substring(0,500).replace('\n','')}`, "SQL")

    }

    try {
        var result = await SQLConnection.query(query)
        return result[0]

    } catch (err) {
        //log error to log file
        log(` [ERROR] `, "SQL", JSON.stringify(err, null, 2))
        return err
    }
}



function log(content, logType, StringDump) {

    var logFile;

    if(CONFIG.debug){
        const date = new Date();
        var formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        if(StringDump != undefined){
            console.log(`[${formattedDate}] ${content} Dump:${StringDump}`)

        }else{
            console.log(`[${formattedDate}] ${content}`)

        }
        
    }

    switch(logType.toUpperCase()){
        case "SQL":
            logFile =  CONFIG.SQLLogLocation
        break;
        case "SERVICE":
            logFile = CONFIG.ServiceLogLocation
        break;
        default:
            logFile = CONFIG.DefaultLogs
    }  

    //string dump max length
    if(StringDump != undefined){
        if(StringDump.length > 5000){
            StringDump = `Dump more then 5000 charr long, trimmed version: \n ${StringDump.substring(0,5000)}`
        }
    }
    

    //get log file version
    var version  = 0
    if(!fs.existsSync(`${__dirname}/data/${logType.toUpperCase()}Pos.txt`)){
        fs.writeFile(`${__dirname}/data/${logType.toUpperCase()}Pos.txt`,'0', err => {
            if (err) {
                console.log(`[ERROR] ${err}`);
            } else {
                //console.log(`${getDate()} [INFO] written to log ${logFile}`)
            }
            writeLog(version, logFile, content, StringDump)
        });
    }else{
        fs.readFile(`${__dirname}/data/${logType.toUpperCase()}Pos.txt`, 'utf8', (err, data) => {
            version = data
            writeLog(version, logFile, content, StringDump)
        })
    }


    function writeLog(version, logFile, content, StringDump){
        //check log file size
        const date = new Date();

        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        var currentDate = `${day}-${month}-${year}` 

        var logFileFormat = `${logFile}_${currentDate}_V${version}.txt`

        var formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
        if(StringDump != undefined){
            var guid = uuidv4()
            StringDump = `<span id="${guid}" class="ConsoleHiddenElementButton" onclick="ShowHide(this)">[show]</span><div id="p${guid}" class="ConsoleHiddenElement" hidden>${StringDump}</div>`
        }else{
            StringDump = ""
        }

        if(!fs.existsSync(logFileFormat)){
            logFileFormat = `${logFile}_${currentDate}_V0.txt`

            //write to new log
            fs.writeFile(logFileFormat,`${formattedDate} ${content} ${StringDump}`, err => {
                if (err) {
                    console.log(`${formattedDate} [ERROR] ${err}`);
                } else {
                    //console.log(`${getDate()} [INFO] written to log ${logFile}`)
                }
            });

            //set log pos file 
            fs.writeFile(`data/${logType.toUpperCase()}Pos.txt`,'0', err => {
                if (err) {
                    console.log(`${formattedDate} [ERROR] ${err}`);
                } else {
                    //console.log(`${getDate()} [INFO] written to log ${logFile}`)
                }
            });
        } else{

            //check file size
            var stats = fs.statSync(logFileFormat)
            var fileSizeInBytes = stats.size;
            // Convert the file size to megabytes (optional)
            var fileSizeInMegabytes = fileSizeInBytes / (1024*1024);

            if(fileSizeInMegabytes > 10){
                //new file needed
                version ++
                logFileFormat = `${__dirname}/${logFile}_${currentDate}_V${version}.txt`

                //write to log
                fs.writeFile(logFileFormat,`${formattedDate} ${content} ${StringDump}`, err => {
                    if (err) {
                        console.log(`${formattedDate} [ERROR] ${err}`);
                    } else {
                        //console.log(`${getDate()} [INFO] written to log ${logFile}`)
                    }
                });

                //set log pos file 
                fs.writeFile(`${__dirname}/data/${logType.toUpperCase()}Pos.txt`,`${version}`, err => {
                    if (err) {
                        console.log(`${formattedDate} [ERROR] ${err}`);
                    } else {
                        //console.log(`${getDate()} [INFO] written to log ${logFile}`)
                    }
                });
            }else{
                //write file
                fs.appendFile(logFileFormat, `\n${formattedDate} ${content} ${StringDump}`, err => {
                    if (err) {
                        console.log(`${formattedDate} [ERROR] ${err}`);
                    } else {
                        //console.log(`${getDate()} [INFO] written to log ${logFile}`)
                    }
                });
            }
        }

    }
}

function getDate() {
    const date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    // This arrangement can be altered based on how we want the date's format to appear.
    let currentDate = `${day}-${month}-${year} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return currentDate
}


function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}