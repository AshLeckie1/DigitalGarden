function CreatePost(post){
    var PostUserData = JSON.parse(post.UserData)
    var PostData = JSON.parse(post.PostData)

    var PostID = PostData.ID.split('-')[PostData.ID.split('-').length - 1]
    var date = new Date(post.posted) 
    var formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    var Links = ""

    PostUserData.Links.forEach(link =>{
        Links += `
        <div onclick="window.open('${link.Link}${link.Username}')" class="${link.Title} link">   
                <div class="IconContainer">
                    <img class="${link.Title}" src="Style/Images/SocialIconsSet.png">
                </div>
                <div class="Username">
                    ${link.Username}
                </div>
        </div>`
    });

    try{
        var TagsArray =  JSON.parse(post.Tags)
        TagsArray = TagsArray.map(function(e){
            return `<a class="postTag" href="/FeedByTag.html?tag=${e}">#${e}</a>`
        })
        var Tags = TagsArray.join(" ")
        
    }catch{
        var Tags = ""
    }


    DoesThisPostBelongToMe(PostData.ID).then(result =>{
        if(!result.error && result.valid){
            document.getElementById(`${PostID}_PostMenu`).innerHTML =  `
            <button>Options</button>
            <div class="PostMenuContent">
                <a href="EditPost.html?draft=${PostData.ID.replace("/","-")}">Edit</a>
                <a class="remove" onclick="DeleteDraft('${PostData.ID}')">Remove</a>
            </div>
            `
        }
    })

       
    var Post = `
    <div class='PostContainer' id='${PostID}_PostContainer' data-UserDataId='${PostID}' onclick="GoToPost('${PostData.ID}','${PostID}')">
        <div class='PostInfo' id='${PostID}_PostInfo'>
            <span class='UserDetails'>
                <img class='UserIcon' src='http://${CONFIG.nodeserver}:${CONFIG.nodeport}/GetUserPfp?UserID=${PostData.Author}' onclick="window.location.href='user.html?ID=${post.Username}'"> 
                <span class="PostUsername" onclick="window.location.href='user.html?ID=${post.Username}'" onmouseover="ShowUserPopup('${PostID}','${PostData.ID}')" id="Username${PostData.ID}" onmouseout="HideUserPopup('${PostID}')">${PostUserData.Alias}</span> <span class="Subtext">${PostUserData.Subtext}</span>
                <div class="PostMenu" id="${PostID}_PostMenu">
                </div>
            <span class='PostDate'>
                ${formattedDate}
            </span>
            <div class="HoverProfile" id="${PostID}" onmouseover="IsMouseInElement('${PostID}',true)" onmouseout="IsMouseInElement('${PostID}',false); HideUserPopup('${PostID}')" data-is-mouse-in=false hidden>
                <div class="row ProfileTitle">
                    <img class='UserIcon' onclick="window.location.href='user.html?ID=${post.Username}'" src='http://${CONFIG.nodeserver}:${CONFIG.nodeport}/GetUserPfp?UserID=${PostData.Author}'> 
                    <span class="Alias" onclick="window.location.href='user.html?ID=${post.Username}'" >${PostUserData.Alias}</span>
                    <span class="Subtext">${PostUserData.Subtext}</spans>
                </div>
                <div class="row">
                    <span class="Pronouns">${PostUserData.ProNouns}</span>
                </div>
                <div class="row">
                    <div class="LinkPreview">
                        ${Links}                                        
                    </div>
                </div>
                <div class="row">
                    <div class="bio">${PostUserData.Bio}</div>
                </div>
            </div>
        </div>
        <button class="ExpansionButton" id="${PostID}_Expand">Expand</button>
        <div class="PostText" id="${PostID}_Textarea">
            ${post.PostHtml}   
        </div>
        
        <div class="Tags">
            ${Tags}
        </div>
        
    </div>
    `
    setTimeout(()=>{isPostNotOverflown(PostID)},200)
    return Post
                    
}

function Expand(PostID){
    var element = document.getElementById(`${PostID}_Textarea`)
    element.classList.add("Expanded")
    document.getElementById(`${PostID}_Expand`).remove()
}

function isPostNotOverflown(elementID) {
    var element = document.getElementById(`${elementID}_Textarea`)
    if(!(element.scrollHeight > element.clientHeight)){
        //remove expand button
        document.getElementById(`${elementID}_Expand`).remove()
    }
}

function GoToPost(FullPostID,PostID){
    //if(document.elementFromPoint($MousePos.x, $MousePos.y) != document.getElementById(`${PostID}_Expand` )){
    if(document.elementFromPoint($MousePos.x, $MousePos.y) == document.getElementById(`${PostID}_PostContainer`)
        || document.elementFromPoint($MousePos.x, $MousePos.y) == document.getElementById(`${PostID}_PostInfo`)
        || document.elementFromPoint($MousePos.x, $MousePos.y) == document.getElementById(`${PostID}_Textarea`)
    )
    {

        window.location.href = `post.html?ID=${FullPostID}`
    }
    else{
        Expand(PostID)
    }
}

 function DeleteDraft(postID){
    if(confirm("Are you sure you want to delete post?")){
        DeleteDraftPost(postID).then(result => {
            if(!result.error){
                document.getElementById(`${postID.split('-')[postID.split('-').length - 1]}_PostContainer`).remove()
                alert("Post was deleted!")
            }else{
                alert("There was an error Deleting post")
            }
        })
    }
}

async function DeleteDraftPost(postID){
    const response = await fetch(`http://${CONFIG.nodeserver}:${CONFIG.nodeport}/DeletePost`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            PostID : postID.replace("/","-"),
            SessionID : GetUserSession()
        })
    });
    return response.json()
}

async function DoesThisPostBelongToMe(postID){
    const response = await fetch(`http://${CONFIG.nodeserver}:${CONFIG.nodeport}/DoesThisPostBelongToMe`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            PostID : postID.replace("/","-"),
            SessionID : GetUserSession()
        })
    });
    return response.json()
}