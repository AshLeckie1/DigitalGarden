
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

            var html = `
                    <li onclick="window.location.href='/'">Home</li>
                    <li onclick="window.location.href='/'">Tags</li>
                    <li onclick="window.location.href='/newPost.html'">Post</li>
                    <li onclick="window.location.href='/user.html?ID=${json.Username}'">Profile</li>
                    <li onclick="window.location.href='Settings.html'">Settings</li>
                    <li id="logout" onclick="ClearLogin()">Logout</li>
                `
            document.getElementById("SideNavUL").innerHTML = html

            return true
                
        }
        else{
            try{
                //location.href="login.html"
                document.getElementById("UserSession").innerHTML = "<a href='Login.html'>[ Login ]</a>"

                //check if there is nav
                if(document.getElementById("NavNewPost")){
                    document.getElementById("NavNewPost").remove()
                    document.getElementById("NavUserAccount").remove()
                    document.getElementById("MainNav").innerHTML += ` <h3 onclick="location.href='login.html'" id="NavLogin">Login</h3>`

                }

                


            }catch(e){}

            return false
        }
    
    }else{
        try{
            //user is not logged in
            //location.href="login.html"
            document.getElementById("UserSession").innerHTML = "<a href='Login.html'>[ Login ]</a>"

            //check if there is nav
            if(document.getElementById("NavNewPost")){
                document.getElementById("MainNav").innerHTML += ` <h3 onclick="location.href='login.html'" id="NavLogin">Login</h3>`
                document.getElementById("NavNewPost").remove()
                document.getElementById("NavUserAccount").remove()
                
            }

            var html = `
                    <li onclick="window.location.href='/'">Home</li>
                    <li onclick="window.location.href='/'">Tags</li>
                    <li onclick="window.location.href='/Login.html'">Login</li>
                `
        document.getElementById("SideNavUL").innerHTML = html
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