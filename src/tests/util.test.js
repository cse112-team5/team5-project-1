testGenerateId();
function testGenerateId(){
    console.log("test generate ID")
    var dict = {}
    duplicate = 0;
    for(i = 0; i < 100000; i++){
        id = generateId(8);
        if(!(id in dict)){
            dict[id] = 1;
        } else{
            document.getElementById("test11").innerHTML = "Passed test 1, generated duplicate id";
            duplicate = 1;
        }
    }
    if(duplicate == 0){
        document.getElementById("test11").innerHTML = "Passed test 1, generated IDs are random";
    }
}

