import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import CONFIG from './Config/Config.json' with { type: "json" };


const app = express();

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

app.get('/', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    //res.status(403).send("You do not have rights to visit this page");
    res.redirect(`${CONFIG.server}:8080\index.html`)
});

app.listen(CONFIG.NodePort, () => {
    log(`[BOOT] WiseRiver Started!`,"Service")
    log(`[BOOT] Version: ${CONFIG.version}`,"Service")
    log(`[BOOT] Port: ${CONFIG.NodePort}`,"Service");
    log(`[BOOT] Cors Options: ${JSON.stringify(corsOptions)}`,"Service")
}); 

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())


var $UserSessions = []
//{Username:{User},SessionStart:{DateTime},SessionID={GUID}}


app.post('/NewUser', (req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.body == null) {
        //if post is missing body
        res.status(400).send({"error":TRUE,msg:"missing POST body!"});
        return;
    }
    
    try{

        //assign all req values
        var Username = req.body.Username
        var Password = req.body.Password
        var InviteKey = req.body.InviteKey
        var UserData = JSON.parse(req.body.UserData)

        //check invite key is valid
        var sql = `SELECT * FROM invite_tokens WHERE ID -eq '${InviteKey}' AND Experation -gt NOW()`
        SqlQuery(sql).then(result =>{
            if(result.length > 0){
                //encrypt password
                var encrypted = crypto.publicEncrypt(CONFIG.DecryptKey, Password);
                //add user record to DB
                sql = `INSERT INTO users (ID, Username, UserData, Passkey) VALUES ((SELECT UUID() AS ID), '${Username}', '${UserData}', '${encrypted}');`
                SqlQuery(sql).then(result =>{
                    // TODO validate result
                    // Send user login session
                    var sessionID = uuidv4()
                    $UserSessions.push({Username:Username,SessionStart:0,SessionID:sessionID})
                    res.status(200).send({"error":FALSE,loginSession,"loginSession":JSON.stringify({Username:Username,SessionStart:0,SessionID:sessionID})})

                }).catch(err => {
                    //there was an issue adding the user
                    var tracker = uuidv4()
                    log(`[ERROR] [${tracker}] Cannot adding user to DB- ${JSON.stringify(err, null, 2)}`,"Service");
                    res.status(500).send({"error":TRUE,"msg":"There was an issue adding a user to the DB","tracker":tracker})
                });
                
            }else{
                //key is invalid or has expired
                res.status(401).send({"error":TRUE,"msg":"Invite key is invalid or has expired!"})
            }
        }).catch(err => {
            //there was a server error getting the invite key
            var tracker = uuidv4()
            log(`[ERROR] [${tracker}] Cannot get invite key from DB - ${JSON.stringify(err, null, 2)}`,"Service");
            res.status(500).send({"error":TRUE,"msg":"Cannot get invite key from DB","tracker":tracker})

        });
        


    }catch(err){
        res.status(500).send({"error":TRUE,"msg":err})
        return;
    }


});

async function SqlQuery(query) {

    //log request to log file
    if(query.length < 500){
        log(` [INFO] SQL REQUEST - ${query.replace('\n','')}`, "SQL")
    }else{
        log(` [INFO] SQL REQUEST - QUERY ABOVE 500 Char, snipping for log size - ${query.substring(0,500).replace('\n','')}`, "SQL")

    }

    var sqlConfig = {
        user: CONFIG.SQLUser,
        password: CONFIG.SQLPass,
        server: CONFIG.SQLServer,
        database: CONFIG.SQLDatabase,
        trustServerCertificate: true
    }

    try {
        //send request
        let pool = await sql.connect(sqlConfig)
        let result = await pool.request()
            .query(query)

        //Log result to log file
        log(` [INFO] SQL RESULT - `, "SQL", JSON.stringify(result, null, 2))
        return result

    } catch (err) {

        //log error to log file
        log(` [ERROR] `, "SQL", JSON.stringify(err, null, 2))
        return err
    }

}



function log(content, logType, StringDump) {

    var logFile;

    if(CONFIG.debug){
        console.log(`${getDate()} - ${content}`)
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
            StringDump = `Dump more then 5000 chrar long, trimmed version: \n ${StringDump.substring(0,5000)}`
        }
    }
    

    //get log file version
    var version  = 0
    if(!fs.existsSync(`data/${logType.toUpperCase()}Pos.txt`)){
        fs.writeFile(`data/${logType.toUpperCase()}Pos.txt`,'0', err => {
            if (err) {
                console.log(`${formattedDate} [ERROR] ${err}`);
            } else {
                //console.log(`${getDate()} [INFO] written to log ${logFile}`)
            }
            writeLog(version, logFile, content, StringDump)
        });
    }else{
        fs.readFile(`data/${logType.toUpperCase()}Pos.txt`, 'utf8', (err, data) => {
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
                logFileFormat = `${logFile}_${currentDate}_V${version}.txt`

                //write to log
                fs.writeFile(logFileFormat,`${formattedDate} ${content} ${StringDump}`, err => {
                    if (err) {
                        console.log(`${formattedDate} [ERROR] ${err}`);
                    } else {
                        //console.log(`${getDate()} [INFO] written to log ${logFile}`)
                    }
                });

                //set log pos file 
                fs.writeFile(`data/${logType.toUpperCase()}Pos.txt`,`${version}`, err => {
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


function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}