async function checkLogin(){
    if(localStorage.SessionID != undefined){
        //user has logged session

        //SessionID = getCookie("sessionLogin")
        var SessionID = localStorage.SessionID

        const response = await fetch(`http://mvs337:3000/checkLogin`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({"SessionID":SessionID})
        });
    
        const json = await response.json()
    
        if(json.login){

           //set new sessionID
           //document.cookie=`sessionLogin = ${json.SessionID};` 
            if(json.Group.trim() == "ADMIN"){
                document.getElementById("LoggedUserName").innerHTML = `${json.Username.split('@')[0]} <br> ${json.Group} <br><a href="/admin.html">[Admin Site]</a> <a id="ProcessFilesQueueIcon" onclick="ToggleProcessedFilesPopup()">[File Process Queue]</a> <a id="logout" onclick="ClearLogin()">[logout]</a>`
            }else{
                document.getElementById("LoggedUserName").innerHTML = `${json.Username.split('@')[0]} <br> ${json.Group} <br><a id="ProcessFilesQueueIcon" onclick="ToggleProcessedFilesPopup()">[File Process Queue]</a> <a id="logout" onclick="ClearLogin()">[logout]</a>`

            }

            return true
                
        }
        else{
            //location.href="login.html"
            return false
        }
    
    }else{
        //user is not logged in
        //location.href="login.html"
        return false
    }
}

//checkLogin()

function ClearLogin(){
    //document.cookie=`sessionLogin = 0`
    localStorage.removeItem("SessionID")
    location.reload()
}


function GetUserSession(){
    return localStorage.SessionID
}