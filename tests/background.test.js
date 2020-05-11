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