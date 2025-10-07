$(document).ready(function() {
    if(localStorage.DarkMode == undefined){
        localStorage.setItem('DarkMode',false)
        document.getElementById("body").classList.add("LightMode")
    }

    if(localStorage.DarkMode == "false"){
        document.getElementById("body").classList.remove("DarkMode")
        document.getElementById("body").classList.add("LightMode")
    }else{
        document.getElementById("body").classList.remove("LightMode")
        document.getElementById("body").classList.add("DarkMode")
    }
});

function ToggleDarkMode(){
    if(localStorage.DarkMode == "true"){
        localStorage.setItem('DarkMode',false)
        document.getElementById("body").classList.remove("DarkMode")
        document.getElementById("body").classList.add("LightMode")
    }else{
        localStorage.setItem('DarkMode',true)
        document.getElementById("body").classList.remove("LightMode")
        document.getElementById("body").classList.add("DarkMode")
    }
}