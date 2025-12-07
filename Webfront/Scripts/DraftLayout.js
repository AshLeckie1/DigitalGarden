function CreatePost(post){
    var PostUserData = JSON.parse(post.UserData)
    var PostData = JSON.parse(post.PostData.replace("-","/"))

    var PostID = PostData.ID.split('-')[PostData.ID.split('-').length - 1]
    var date = new Date(post.posted) 
    var formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    var Post = `
    <div class='PostContainer' data-UserDataId='${PostID}' id="${PostID}">
        <div class='PostInfo'>
             <span class='UserDetails'>
                <a href="NewPost.html?draft=${PostData.ID.replace("/","-")}">Edit</a>
                <a onclick="DeleteDraft('${PostData.ID}')">Remove</a>
             </span>
            <span class='PostDate'>
                ${formattedDate}
            </span>
        </div>
        <div class="PostText" id="${PostID}_Textarea">
            ${post.PostHtml}   
        </div>
        <button class="ExpansionButton" id="${PostID}_Expand" onclick="Expand('${PostID}')">Expand</button>
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

 function DeleteDraft(postID){
    if(confirm("Are you sure you want to delete post?")){
        DeleteDraftPost(postID).then(result => {
            if(!result.error){
                document.getElementById(postID.split('-')[postID.split('-').length - 1]).remove()
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
            SessionID : $session.UserID 
        })
    });

    return response.json()
}