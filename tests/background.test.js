const db = firebase.firestore();

function testGetDomain() {
    console.log("Testing getDomain");
    sitesList = getDomains();
    sitesList.then(sitesList_ => {
        tempMap = new Map(Object.entries(sitesList_["domains"]));
        if (tempMap.has("https://www.google.com/")) {
            document.getElementById("test1").innerHTML = "Passed test 1. Detected google.com in domain";
            //testAddUrl();
        } else {
            document.getElementById("test1").innerHTML = "Failed test 1.";
            process.exit(-1);
        }
    })
}

testGetDomain()

function testAddUrl() {
    console.log("Testing addUrl");
    addURL("test");
    done = getDomains();
    done.then(done_ => {
        db.collection('users').doc('user_0').get().then((snapshot) => {
            var domains = snapshot.data()["domains"];
            if ("test" in domains) {
                document.getElementById("test2").innerHTML = "Passed test 2, 'test' is in domain";
                //testIncrementDomainVisits();
            } else {
                document.getElementById("test2").innerHTML = "Failed test 2, 'test' is not in domain";
                process.exit(-1);
            }
        })
    })
}

testAddUrl()

function testIncrementDomainVisits() {
    console.log("Testing incrementDomainVisits");
    db.collection('users').doc('user_0').get().then((snapshot) => {
        oldVis = snapshot.data()["domains"]["test"]["visits"];
        addURL("test");
        addUrlDone = getDomains();
        addUrlDone.then(done_ => {
            db.collection('users').doc('user_0').get().then((snapshot) => {
                var domains = snapshot.data()["domains"];
                vis = domains["test"]["visits"];
                if (vis == oldVis + 1) {
                    document.getElementById("test3").innerHTML = "Passed test 3. Expected value: " + (oldVis + 1) + ". Actual value: " + vis;
                } else {
                    document.getElementById("test3").innerHTML = "Failed test 3. Expected value: " + (oldVis + 1) + ". Actual value: " + vis;
                }
            })
        })
    })

}
testIncrementDomainVisits();


function testGetProductivity(){
    console.log("Testing getProductivity");
    db.collection('users').doc('user_0').get().then((snapshot) => {
        var domains = snapshot.data()["domains"];
        var totalTime = 0;
        var prodTime = 0;
        var keys = Object.keys(domains);
        keys.forEach(key => {
            var currTime = domains[key]["time"];
            if (domains[key]["productive"]) {
              prodTime += currTime;
            }
            totalTime += currTime;
          })
        var productivity = 0;
        if(totalTime == 0){
            productivity = -1;
        } else{
            productivity = prodTime / totalTime * 100;
        }
        done = getProductivity();
        done.then(done_ => {
            if(done_ == productivity){
                document.getElementById("test5").innerHTML = "Passed test 4. Expected value: " + (productivity) + ". Actual value: " + done_;
            } else{
                document.getElementById("test5").innerHTML = "Failed test 4. Expected value: " + (productivity) + ". Actual value: " + done_;
            }
        })
    })
}
testGetProductivity();

function testIncrementDomainActivity(){
    db.collection('users').doc('user_0').get().then((snapshot) => {
        oldTime = snapshot.data()["domains"]["test"]["time"];
        incrementDomainActivity("test", 10);
        addUrlDone = getDomains();
        addUrlDone.then(done_ => {
            db.collection('users').doc('user_0').get().then((snapshot) => {
                var domains = snapshot.data()["domains"];
                time = domains["test"]["time"];
                if (oldTime + 10 == time) {
                    document.getElementById("test6").innerHTML = "Passed test 5. Expected value: " + (oldTime + 10) + ". Actual value: " + time;
                } else {
                    document.getElementById("test6").innerHTML = "Failed test 5. Expected value: " + (oldTime + 10) + ". Actual value: " + time;
                }
            })
        })
    })
}

testIncrementDomainActivity();
