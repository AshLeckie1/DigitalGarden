
// set nav position on page load
$(document).ready(function() {
    SetNavPosition()
    
    var body =  document.getElementsByTagName("body")[0]
    if(body.clientHeight < $(document).height()){
        body.style = `min-height:${$(document).height()}px !important;`

    }
})

// set nav position on resize 
$(window).resize(function() {
    SetNavPosition()
})

function SetNavPosition(){
    var screenWidth = $(document).width();;

    var MainBody = document.getElementsByClassName("MainBody")[0]
    var MainBodyStyle = MainBody.currentStyle || window.getComputedStyle(MainBody);

    var SideNav = document.getElementById("SideNavUL")
    

    if(screenWidth < 1390){
        MainBody.style = "margin-right:1rem; margin-left:22rem;"
        SideNav = "margin-left:0;"
        
    }else{
        var MarginRight = Math.floor((screenWidth - parseInt(MainBodyStyle.width.replace("px","")))/2)
        MainBody.style = ` margin-right:${MarginRight}px;`
        SideNav.style = `margin-left:calc(${MainBodyStyle.marginRight} - 22rem) !important;`
    }
}

function CreateNav(UserID){

    if(UserID){
        var html = `
            <li onclick="window.location.href='/'">Home</li>
            <li onclick="window.location.href='/search.html'">Search</li>
            <li onclick="window.location.href='/tags.html'">Tags</li>
            <li onclick="window.location.href='/newPost.html'">Post</li>
            <li onclick="window.location.href='/user.html?ID=${UserID}'">Profile</li>
            <li onclick="window.location.href='Settings.html'">Settings</li>
            <li id="logout" onclick="ClearLogin()">Logout</li>
        `
        document.getElementById("SideNavUL").innerHTML = html
    }else{
        var html = `
            <li onclick="window.location.href='/'">Home</li>
            <li onclick="window.location.href='/search.html'">Search</li>
            <li onclick="window.location.href='/tags.html'">Tags</li>
            <li onclick="ToggleDarkMode()">Light/Dark</li>
            <li onclick="window.location.href='/Login.html'">Login</li>
        `
        document.getElementById("SideNavUL").innerHTML = html
    }

    
}