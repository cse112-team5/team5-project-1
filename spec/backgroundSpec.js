var firebase = require("firebase/app");
require("firebase/firestore");
var firebaseConfig = {
    apiKey: "AIzaSyCOhTt25qhJtQyWSEUFCU3s_ZE9EC3EiGs",
    authDomain: "cse112-sp20.firebaseapp.com",
    databaseURL: "https://cse112-sp20.firebaseio.com",
    projectId: "cse112-sp20",
    storageBucket: "cse112-sp20.appspot.com",
    messagingSenderId: "861300546651",
    appId: "1:861300546651:web:93eb90114a9f3e6df1737e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function addURL(domain) {
    sitesList = getDomains();
    await sitesList.then(sitesList_ => {
      tempMap = new Map(Object.entries(sitesList_["domains"]));
      if (!tempMap.has(domain)) {
        var userRef = db.collection("users").doc("user_0");
        var domainString = "domains." + domain;
        sitesList_["domains"][domain] = { time: 0, productive: false, visits: 1 };
        userRef.set(sitesList_);
      }
      else {
        incrementDomainVisits(domain);
      }
    })
    domains = await getDomains();
    return domains;
}
async function getDomains() {
    const user = db.collection('users').doc('user_0');
    userData = await user.get();
    return userData.data();
}

const incrementDomainVisits = (domain) => {
    if (domain.length == 0) return -1;
    var vis = -1;
    var tim = 0;
    var prod = false;
    db.collection('users').doc('user_0').get().then((snapshot) => {
      var domains = snapshot.data()["domains"];
      if (domain in domains) {
        vis = domains[domain]["visits"];
        tim = domains[domain]["time"]; 
        prod = domains[domain]["productive"]; 
      }
      else return 1;  // couldn't find the domain
  
      var sitesList = snapshot.data();
  
      //console.log("incrementing visits for " + domain);
      var userRef = db.collection("users").doc("user_0");
      sitesList["domains"][domain] = { time: tim, productive: prod, visits: vis + 1 };
      userRef.set(sitesList);
      return 0;
    })
  }

function testGetDomain(){
    console.log("Testing getDomain");
    sitesList = getDomains();
    sitesList.then(sitesList_ => {
        tempMap = new Map(Object.entries(sitesList_["domains"]));
        if (tempMap.has("https://www.google.com/")) {
            console.log("Passed test 1. Detected google.com in domain");
            console.log("");
            testAddUrl();
        }
        else {
            console.log("Failed test 1.");
            process.exit(-1);
        }
    })
}

function testAddUrl(){
    console.log("Testing addUrl")
    done = addURL("test");
    done.then(done_ => {
        db.collection('users').doc('user_0').get().then((snapshot) => {
            var domains = snapshot.data()["domains"];
            if ("test" in domains) {
                console.log("Passed test 2, 'test' is in domain");
                console.log("");
                testIncrementDomainVisits();
            }
            else{
                console.log("Failed test 2, 'test' is not in domain");
                process.exit(-1);
            }
        })
    })
}

function testIncrementDomainVisits(){
    
    console.log("Testing incrementDomainVisits");
    db.collection('users').doc('user_0').get().then((snapshot) => {
        oldVis = snapshot.data()["domains"]["test"]["visits"];
        addUrlDone = addURL("test");
        addUrlDone.then(done_ => {
            db.collection('users').doc('user_0').get().then((snapshot) => {
                var domains = snapshot.data()["domains"];
                vis = domains["test"]["visits"];
                if(vis == oldVis+1){
                    console.log("Passed test 3. Expected value: " + (oldVis+1) + ". Actual value: " + vis);
                    process.exit(0);
                } else{
                    console.log("Failed test 3. Expected value: " + (oldVis+1) + ". Actual value: " + vis);
                    process.exit(-1);
                }
            })
        })
    })
    
}
testGetDomain();


/*
describe("addURL", function() {
    it("addURL", function() {
        addURL("test");
        sitesList = getDomains();
        console.log(domain);
        sitesList.then(sitesList_ => {
        tempMap = new Map(Object.entries(sitesList_["domains"]));
    });
});*/