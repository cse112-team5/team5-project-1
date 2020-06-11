const db = firebase.firestore();
var googleProvider = new firebase.auth.GoogleAuthProvider();
var inviteCode = 0;
var teamID = 0;
firebase.auth().signInWithPopup(googleProvider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    // ...
    testGetDomain();
    testAddUrl();
    testIncrementDomainVisits();
    testAddSameUrl();
    testGetUserStats();
    testIncrementDomainActivity();
    testCreateTeam();

  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
 

// api
async function testGetDomain() {
    console.log("Testing getDomain");
    const user = firebase.auth().currentUser;
    domains = await getDomains( user);
    tempMap = new Map(Object.entries(domains));
    if (tempMap.has("chrome-extension:")) {
        document.getElementById("test1").innerHTML = "Passed test 1. Detected chrome-extension: in domain";
    } else {
        document.getElementById("test1").innerHTML = "Failed test 1.";     
    }
}


// background
function testAddUrl() {
    console.log("Testing addUrl");
    const user = firebase.auth().currentUser;
    done = addURL("test");
    done.then(done_ => {
        db.collection('users').doc(user.uid).get().then((snapshot) => {
            var domains = snapshot.data()["domains"];
            console.log(domains);
            if ("test" in domains) {
                document.getElementById("test2").innerHTML = "Passed test 1, 'test' is in domain";
                //testIncrementDomainVisits();
            } else {
                document.getElementById("test2").innerHTML = "Failed test 1, 'test' is not in domain";
            }
        })
    })
}



// api
function testAddSameUrl() {
    console.log("Testing incrementDomainVisits");
    const user = firebase.auth().currentUser;
    db.collection('users').doc(user.uid).get().then((snapshot) => {
        oldVis = snapshot.data()["domains"]["test"]["visits"];
        addURL("test");
        addUrlDone = getDomains();
        addUrlDone.then(done_ => {
            db.collection('users').doc(user.uid).get().then((snapshot) => {
                var domains = snapshot.data()["domains"];
                vis = domains["test"]["visits"];
                if (vis == oldVis + 1) {
                    document.getElementById("test3").innerHTML = "Passed test 2. Expected value: " + (oldVis + 1) + ". Actual value: " + vis;
                } else {
                    document.getElementById("test3").innerHTML = "Failed test 2. Expected value: " + (oldVis + 1) + ". Actual value: " + vis;
                }
            })
        })
    })
}

function testIncrementDomainVisits(){
    console.log("Testing incrementDomainVisits");
    const user = firebase.auth().currentUser;
    db.collection('users').doc(user.uid).get().then((snapshot) => {
        oldVis = snapshot.data()["domains"]["test"]["visits"];
        incrementDomainVisits("test");
        addUrlDone = getDomains();
        addUrlDone.then(done_ => {
            db.collection('users').doc(user.uid).get().then((snapshot) => {
                var domains = snapshot.data()["domains"];
                vis = domains["test"]["visits"];
                if (vis == oldVis + 1) {
                    document.getElementById("test4").innerHTML = "Passed test 2. Expected value: " + (oldVis + 1) + ". Actual value: " + vis;
                } else {
                    document.getElementById("test4").innerHTML = "Failed test 2. Expected value: " + (oldVis + 1) + ". Actual value: " + vis;
                }
            })
        })
    })
}


// api
function testGetUserStats(){
    console.log("Testing getProductivity");
    const user = firebase.auth().currentUser;
    db.collection('users').doc(user.uid).get().then((snapshot) => {
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
            productivity = null;
        } else{
            productivity = prodTime / totalTime * 100;
        }
        done = getUserStats();
        done.then(done_ => {
            tempMap = new Map(Object.entries(done_));
            if(tempMap.get("productivity") == productivity){
                document.getElementById("test5").innerHTML = "Passed test 3. Expected value: " + (productivity) + ". Actual value: " + tempMap.get("productivity");
            } else{
                document.getElementById("test5").innerHTML = "Failed test 3. Expected value: " + (productivity) + ". Actual value: " + tempMap.get("productivity");
            }
        })
    })
}

// api
function testIncrementDomainActivity(){
    console.log("test incrementDomainActivity")
    const user = firebase.auth().currentUser;
    db.collection('users').doc(user.uid).get().then((snapshot) => {
        oldTime = snapshot.data()["domains"]["test"]["time"];
        incrementDomainActivity("test", 10);
        addUrlDone = getDomains();
        addUrlDone.then(done_ => {
            db.collection('users').doc(user.uid).get().then((snapshot) => {
                var domains = snapshot.data()["domains"];
                time = domains["test"]["time"];
                if (oldTime + 10 == time) {
                    document.getElementById("test6").innerHTML = "Passed test 4. Expected value: " + (oldTime + 10) + ". Actual value: " + time;
                } else {
                    document.getElementById("test6").innerHTML = "Failed test 4. Expected value: " + (oldTime + 10) + ". Actual value: " + time;
                }
            })
        })
    })
}

// api
async function testCreateTeam(){
    console.log("test Create Team")
    teamInfo = await createTeam("test_team");
    console.log(teamInfo);
    db.collection("teams").doc(teamInfo.id).get()
        .then(doc=> {
            if(!doc.exists){
                document.getElementById("test7").innerHTML = "Failed test 5, Team creation failed";
            } else{
                document.getElementById("test7").innerHTML = "Passed test 5, Team creation succeeded";
                inviteCode = teamInfo.inviteCode;
                teamID = teamInfo.id;
                testGetTeam();
                testJoinTeam();
                
            }
        })
}

// api
async function testGetTeam(){
    console.log("test get Team");
    teamInfo = await getTeam(teamID);
    if(teamInfo.id == teamID && teamInfo.name == "test_team"){
        document.getElementById("test8").innerHTML = "Passed test 6, getTeam succeeded";
    } else{
        document.getElementById("test8").innerHTML = "Passed test 6, getTeam Failed";
    }
}

// api
async function testJoinTeam(){
    console.log("test join Team");
    const user = firebase.auth().currentUser;
    await joinTeam(teamID, inviteCode);
    db.collection('users').doc(user.uid).get().then((snapshot) => {
        var myTeamId = snapshot.data()["teamId"];
        if(teamID == myTeamId){
            db.collection('teams').doc(teamID).get().then((snapshot2) => {
                membersList = snapshot2.data()["members"];
                console.log(membersList);
                if(membersList.includes(user.uid)){
                    document.getElementById("test9").innerHTML = "Passed test 7, joinTeam succeeded";
                    testLeaveTeam();
                }
                else{
                    document.getElementById("test9").innerHTML = "Failed test 7, Team doc doesn't contain user'id";
                }
            })
        } else{
            document.getElementById("test9").innerHTML = "Failed test 7, user's doc doesn't contain team's id";
        }

    });
}

//api
async function testLeaveTeam(){
    console.log("test leave team");
    const user = firebase.auth().currentUser;
    const userRef = await db.collection("users").doc(user.uid).get();
    var data = userRef.data();
    const teamId = data.teamId;
    await leaveTeam();
    const newUserRef = await db.collection("users").doc(user.uid).get();
    console.log(newUserRef.data());
    if(newUserRef.data().teamId != null){
        document.getElementById("test10").innerHTML = "Failed test 8, user's doc still contains team id";
    }
    else{
        db.collection("teams").doc(teamId).get().then((snapshot) =>{
            memberList = snapshot.data()["members"];
            if(memberList.includes(user.uid)){
                document.getElementById("test10").innerHTML = "Failed test 8, Team doc still contain user'id";
            } else{
                document.getElementById("test10").innerHTML = "Passed test 8, leave team succeeded";
            }
        })
    }

}


