function CreatePost(post){
    var PostUserData = JSON.parse(post.UserData)
    var PostData = JSON.parse(post.PostData.replace("-","/"))

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
    
    var Post = `
    <div class='PostContainer' data-UserDataId='${PostID}'>
        <div class='PostInfo'>
            <span class='UserDetails' 
                <img class='UserIcon' src='Style/Images/DefaultUserProfile.png'> 
                <span class="PostUsername" onmouseover="ShowUserPopup('${PostID}','${PostData.ID}')" id="Username${PostData.ID}" onmouseout="HideUserPopup('${PostID}')">${PostUserData.Alias}</span> <span class="Subtext">${PostUserData.Subtext}</span>
            <span class='PostDate'>
                ${formattedDate}
            </span>
            <div class="HoverProfile" id="${PostID}" onmouseover="IsMouseInElement('${PostID}',true)" onmouseout="IsMouseInElement('${PostID}',false); HideUserPopup('${PostID}')" data-is-mouse-in=false hidden>
                <div class="row ProfileTitle">
                    <img class='UserIcon' src='http://localhost:3000/GetUserPfp?UserID=${PostData.Author}'> 
                    <span class="Alias">${PostUserData.Alias}</span>
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
        <div class="PostText">
            ${post.PostHtml}   
        </div>
    </div>
    `

    return Post
                    
}