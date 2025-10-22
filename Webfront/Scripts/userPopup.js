function ShowUserPopup(PopupID,PostID){
    setTimeout(function(){
        if(document.elementFromPoint($MousePos.x, $MousePos.y) == document.getElementById(`Username${PostID}`)){
            $(`#${PopupID}`).show()
        }
    },500)
}

function HideUserPopup(PopupID){
    setTimeout(function(){
        if(document.getElementById(PopupID).dataset.isMouseIn == 'false'){
            $(`#${PopupID}`).hide()
        }
    },500)
}

function IsMouseInElement(element, state){
    document.getElementById(element).dataset.isMouseIn = state
}

$MousePos = {x:0,y:0}

//store mouse position
document.addEventListener('mousemove', function(event) {
    $MousePos.x = event.clientX
    $MousePos.y = event.clientY
});