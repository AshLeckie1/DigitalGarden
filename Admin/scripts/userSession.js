
async function checkLogin(){
    if(localStorage.SessionID != undefined){
        //user has logged session

        //SessionID = getCookie("sessionLogin")
        var SessionID = localStorage.SessionID

        const response = await fetch(`http://${CONFIG.nodeserver}:${CONFIG.nodeport}/checkLogin`, {
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
            
            if(json.Permission != "ADMIN"){
                ClearLogin()
                window.location.href = `http://vm005/`
            }


            try{
                document.getElementById("UserSession").innerHTML = `
                <img class="UserIcon" onclick="window.location.href='Settings.html';" src='http://${CONFIG.nodeserver}:${CONFIG.nodeport}/GetUserPfp?UserID=${json.UserID}'>  
                `
                if(document.getElementById("NavUserAccount")){
                    $("#NavUserAccount").click(function (){location.href=`user.html?ID=${json.Username}`})
                }
            }catch(e){}
            
            //set nav to logged user
            document.getElementById("LoggedUserName").innerHTML = json.Username

            return true
                
        }
        else{            
            return false
        }
    
    }else{
        return false
    }
}


function ClearLogin(){
    //document.cookie=`sessionLogin = 0`
    localStorage.removeItem("SessionID")
    location.href="index.html"
}


function GetUserSession(){
    return localStorage.SessionID
}