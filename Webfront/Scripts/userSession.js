
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
   
            document.getElementById("UserSession").innerHTML = `
            <img class="UserIcon" onclick="window.location.href='Settings.html';" src='http://localhost:3000/GetUserPfp?UserID=${json.UserID}'>  
            `
            if(document.getElementById("NavUserAccount")){
                $("#NavUserAccount").click(function (){location.href=`user.html?user=${json.Username}`})
            }


            return true
                
        }
        else{
            //location.href="login.html"
            document.getElementById("UserSession").innerHTML = "<a href='Login.html'>[ Login ]</a>"

            //check if there is nav
            if(document.getElementById("NavNewPost")){
                document.getElementById("NavNewPost").remove()
                document.getElementById("NavUserAccount").remove()
            }
            return false
        }
    
    }else{
        //user is not logged in
        //location.href="login.html"
        document.getElementById("UserSession").innerHTML = "<a href='Login.html'>[ Login ]</a>"

         //check if there is nav
        if(document.getElementById("NavNewPost")){
            document.getElementById("NavNewPost").remove()
            document.getElementById("NavUserAccount").remove()
            document.getElementById("MainNav").innerHTML += ` <h3 onclick="location.href='login.html'" id="NavLogin">Login</h3>`
        }


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