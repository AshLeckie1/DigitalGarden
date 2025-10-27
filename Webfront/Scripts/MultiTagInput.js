
function InitializeMultiTagInput(ElementID,PlaceholderText){
    //create input div
    var DIV = document.getElementById(ElementID)
    DIV.classList.add("MultiTagInput_DIV")

    //create user input
    var input = document.createElement("input")
    input.classList.add("MultiTagInput_UserInput")
    input.id = `${ElementID}_UserInput`
    input.setAttribute("maxlength",40)
    if(PlaceholderText != undefined){
        input.placeholder = PlaceholderText
    }
    

    //create hidden input
    var hiddenInput = document.createElement("input")
    hiddenInput.classList.add("MultiTagInput_Hidden")
    hiddenInput.id = `${ElementID}_Hidden`
    hiddenInput.hidden = true
    hiddenInput.value = "[]"

    //add inputs to div
    DIV.innerHTML += input.outerHTML + hiddenInput.outerHTML

    //set keypress so that when the user input is entered, the value is added as a tag
    $(`#${DIV.id}_UserInput`).bind("keypress keydown",function(event) {
        var key = event.which || event.keyCode || event.charCode;
        if (key == 13) {
            var text = document.getElementById( `${ElementID}_UserInput`).value
            //clear input
            document.getElementById( `${ElementID}_UserInput`).value = ""
            //add tag
            AddTag(text,ElementID)        
        }
        
        if(key == 8){
            //remove last tag if the text box is empty
            if(document.getElementById( `${ElementID}_UserInput`).value == ""){
                var value = JSON.parse(document.getElementById(`${ElementID}_Hidden`).value)
                RemoveTag(value[value.length-1].tagID,ElementID)

            }
        }
    });
}

function MultiTagValue(ElementID){
    var HiddenInput = document.getElementById(`${ElementID}_Hidden`)
    try{
        var currentVal = JSON.parse(HiddenInput.value)
        currentVal = currentVal.map(function(e){
            return e.value.replaceAll(" ","_")
        })

        return currentVal
    }catch{
        return []
    }
}

function AddTag(text,input){
    if(text == undefined || text.trim() == ""){
        return
    }

    //limit tag to 50 char 
    if(text.length > 50){
        text = text.substring(0,50)
    }

    //create tag div
    var tagDiv = document.createElement("div")
    tagDiv.classList.add("Tag")
    tagDiv.id = uuidv4()
    tagDiv.innerHTML = ` <span class="name">${text} |</span><span class="close" onclick="RemoveTag('${tagDiv.id }','${input}')">X</span>`

    //add tag before input
    $(`#${input} .MultiTagInput_UserInput:last`).before(tagDiv)
    
    var HiddenInput = document.getElementById(`${input}_Hidden`)
    try{
        var currentVal = JSON.parse(HiddenInput.value)
        currentVal.push({tagID:tagDiv.id,value:text})
        HiddenInput.value = JSON.stringify(currentVal)
    }catch{
        HiddenInput.value =JSON.stringify([{tagID:tagDiv.id,value:text.trim()}])
    }
}

function RemoveTag(TagID,inputId){
    document.getElementById(TagID).remove()
    var HiddenInput = document.getElementById(`${inputId}_Hidden`)
    
    var currentVal = JSON.parse(HiddenInput.value)
    currentVal = currentVal.filter(function(e){
        if(e.tagID!=TagID){
            return e
        }
    })

    HiddenInput.value = JSON.stringify(currentVal)
}

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}