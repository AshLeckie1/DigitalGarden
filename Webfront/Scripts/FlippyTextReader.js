var Titles = [
    "Digital Garden",
    "Online Backyard",
    "Home Place",
    "The Blog Site",
    "The Amazing Digital Garden",
    "Do you like Kombucha?"
]

var TitleMaxLength = 45

var Characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?@~ ".split("")


function TriggerChange(elementID){
    var element = document.getElementById(elementID)

    var SelectedTitle = Titles[Math.floor(Math.random() * Titles.length)].padEnd(TitleMaxLength, " ")
    

    if(element.innerHTML == ''){
        var output = " ".repeat(SelectedTitle.length)
    }else{
        var output  = element.innerHTML
    }

    var complete = false

    setTimeout(tick,5)

    function tick(){
        var charArray = output.split("")
        var index = 0
        charArray = charArray.map((e)=>{
            var pos = Characters.indexOf(e)
            var selectedTitleChar = (SelectedTitle.split(""))[index]
            index ++
            
            
            if(selectedTitleChar == e){
                return e
            }
            else{
                if(pos + 1 == Characters.length){
                    pos = 0
                    e = Characters[pos]
                }else{
                    e = Characters[pos + 1]
                }

                return e
            }            
        })
        
        output = charArray.toString().replaceAll(",","")

        element.innerHTML = output

        if(output != SelectedTitle){
            setTimeout(tick,20)
        }
    }
}