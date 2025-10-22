var SiteList = [
    {Title:"Admin Home", Url:"/index.html"},
    {Title:"User Sessions" , Url:"/UserSessions.html"},
    {Title:"User Managment", Url:"/UserManagment.html"}
]

$(document).ready(function() {
    var SideNavNodes =  document.getElementsByClassName("SideNav")[0].childNodes;

    var index=0
    var nav = null
    while(SideNavNodes[index].nodeName != "UL"){

        nav = SideNavNodes[index + 1]

        index ++

    }
    

    SiteList.forEach(Site => {
        if(window.location.href.toUpperCase().includes(Site.Url.toUpperCase())){
            nav.innerHTML += `<li class="selected" onclick="window.location.href = '${Site.Url}'">${Site.Title}</li>`

        }
        else{
            nav.innerHTML += `<li onclick="window.location.href = '${Site.Url}'">${Site.Title}</li>`

        }

    });

});


//document.getElementsByClassName("SideNav")[0].childNodes[0].nodeName