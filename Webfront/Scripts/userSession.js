
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
   
            document.getElementById("UserSession").innerHTML = `<img class="UserIcon" src='Style/Images/DefaultUserProfile.png'><span id="Username">${json.Username.split('@')[0]}</span> <br> <a id="logout" onclick="ClearLogin()">[logout]</a>`
            return true
                
        }
        else{
            //location.href="login.html"
            document.getElementById("UserSession").innerHTML = "<a href='login.html'>[ Login ]</a>"
            return false
        }
    
    }else{
        //user is not logged in
        //location.href="login.html"
        document.getElementById("UserSession").innerHTML = "<a href='login.html'>[ Login ]</a>"
        return false
    }
}


function ClearLogin(){
    //document.cookie=`sessionLogin = 0`
    localStorage.removeItem("SessionID")
    location.reload()
}


function GetUserSession(){
    return localStorage.SessionID
}