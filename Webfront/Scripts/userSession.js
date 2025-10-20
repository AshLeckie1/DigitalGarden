
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
            try{
                document.getElementById("UserSession").innerHTML = `
                <img class="UserIcon" onclick="window.location.href='Settings.html';" src='http://${CONFIG.nodeserver}:${CONFIG.nodeport}/GetUserPfp?UserID=${json.UserID}'>  
                `
                if(document.getElementById("NavUserAccount")){
                    $("#NavUserAccount").click(function (){location.href=`user.html?ID=${json.Username}`})
                }
            }catch(e){}
            
            //set nav to logged user
            CreateNav(json.Username)

            return true
                
        }
        else{
            try{
                //location.href="login.html"
                document.getElementById("UserSession").innerHTML = "<a href='Login.html'>[ Login ]</a>"

                //Set nav to login

            }catch(e){}
            CreateNav(false)
            return false
        }
    
    }else{
        try{
            //user is not logged in
            //location.href="login.html"
            document.getElementById("UserSession").innerHTML = "<a href='Login.html'>[ Login ]</a>"

            //set nav to login
            CreateNav(false)

        }catch(e){}
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