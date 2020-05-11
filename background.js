/*
 * Firebase initializations
 */


// TODO(DEVELOPER): Change the values below using values from the initialization snippet: Firebase Console > Overview > Add Firebase to your web app.
// Initialize Firebase
var config = {
  apiKey: "TODO",
  authDomain: "TODO",
  databaseURL: "TODO",
  projectId: "TODO",
  storageBucket: "TODO",
  messagingSenderId: "TODO",
  appId: "TODO"
};

firebase.initializeApp(config);

const initApp = () => {
  // Listen for auth state changes.
  // TODO: we'll implement this later when we startw working on user auth
  firebase.auth().onAuthStateChanged(function (user) {
    console.log('User state change detected from the Background script of the Chrome Extension:', user);
  });
}



/*
 * Firebase communcation API
 */


/*
 * NOTE: Since we haven't implemented authentication yet, the following API calls should assume a global
 * user, 'user_0'. Once we've implemented user auth, the API calls below can grab the user id from the
 * Firebase auth object. So, there's no need to pass in user id as a parameter as long as the user is
 * logged in.
 */

/*
 * Increments the time spent on a domain for the user
 *
 * paremeters:
 *      domain (string) - domain for which we're incrementing (e.g. 'reddit.com')
 *      increment (int) - the additional (active) time in seconds spent on the site (non-negative)
 *
 * return
 *      0 upon success, 1 otherwise
 */
const incrementDomainActivity = (domain, increment) => {
  if (domain.length == 0) return -1;

  const db = firebase.firestore();

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
    
    var userRef = db.collection("users").doc("user_0");
    console.log("incrementing activity time for " + domain + " by " + increment);
    sitesList["domains"][domain] = { time: tim + increment, productive: prod, visits: vis };
    userRef.set(sitesList);
    return 0;
  })
}

/*
 * Increments the number of visites on a domain for the user by one
 *
 * paremeters:
 *      domain (string) - domain for which we're incrementing (e.g. 'reddit.com')
 *
 * return
 *      0 upon success, 1 otherwise
 */
const incrementDomainVisits = (domain) => {
  if (domain.length == 0) return -1;

  const db = firebase.firestore();
  
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
   
    console.log("incrementing visits for " + domain);
    var userRef = db.collection("users").doc("user_0");
    sitesList["domains"][domain] = { time: tim, productive: prod, visits: vis + 1 };
    userRef.set(sitesList);
    return 0;
  })
}

/*
 * Calculates the productivity score of the user
 *
 * To calculate the productivity score, first retreive the domain map from
 * Firebase. Then, divide the total time spend on productive sites by the
 * total time spent. If the denominator is 0, return -1. Else return a the 
 * score as a percentage float between 0 - 100
 *
 * paremeters:
 *      none
 *
 * return
 *      0.0 - 100.0 upon success, -1 otherwise
 */
const getProductivity = () => {
  const db = firebase.firestore();

  db.collection('users').doc('user_0').get().then((snapshot) => {
    var domains = snapshot.data()["domains"];
    
    var keys = Object.keys(domains);

    var totalTime = 0;
    var prodTime = 0;

    keys.forEach(key => {
      var currTime = domains[key]["time"];
      if (domains[key]["productive"]) {
        prodTime += currTime;
      }
      totalTime += currTime;
    })
    console.log("Total time = " + totalTime + ", Productive time = " + prodTime);
    console.log("Productivity = " + (prodTime / totalTime) * 100 + "%");
    
    if (totalTime == 0) return -1; // cannot divide by zero, return error

    return (prodTime / totalTime) * 100;
  })
  return -1; // something went wrong, return error
}



/*
 * Client side functions
 */

var curPage = {};
var map = new Map();
var listOfDomainsToUpdate = new Array();
var views = chrome.extension.getViews({
  type: "popup"
});

const formatDuration = (d) => {
  if (d < 0) {
    return "?";
  }
  var divisor = d < 3600000 ? [60000, 1000] : [3600000, 60000];
  function pad(x) {
    return x < 10 ? "0" + x : x;
  }
  return Math.floor(d / divisor[0]) + ":" + pad(Math.floor((d % divisor[0]) / divisor[1]));
}

const tick = () => {
  if (curPage.begin === undefined)
    return;
  
  if (map.has(curPage.domain)){
    const timeSinceBegin = formatDuration(new Date() - curPage.begin + map.get(curPage.domain));
    chrome.browserAction.setBadgeText({ 'tabId': parseInt(curPage.tabId), 'text': timeSinceBegin});
  } else {
    const timeSinceBegin = formatDuration(new Date() - curPage.begin);
    chrome.browserAction.setBadgeText({ 'tabId': parseInt(curPage.tabId), 'text': timeSinceBegin});
  }
};

const updateDatabaseWithDomainTimes = () =>{
  // add domain of current tab to list
  listOfDomainsToUpdate.push(curPage.domain);
  const currTime = new Date();
  if (map.has(curPage.domain)){
    const oldTime = map.get(curPage.domain);
    map.set(curPage.domain, oldTime + (currTime- curPage.begin));
  } else {
    map.set(curPage.domain, (currTime - curPage.begin));
  }
  curPage.begin = currTime; // reset start time for current active domain

  const db = firebase.firestore();
  const user = db.collection('users').doc('user_0');
  let userData = user.get().then(documentSnapshot => {
    if (documentSnapshot.exists){
      let data = documentSnapshot.data();

      for (let i = 0; i < listOfDomainsToUpdate.length; i++){

        const currDomain = listOfDomainsToUpdate[i];
        const tempMap = new Map(Object.entries(data["domains"]));
        
        // get time for domain
        const time = map.get(currDomain);

        if (tempMap.has(currDomain)){
          // update
          data["domains"][currDomain] = { time: time, productive: data["domains"][currDomain]["productive"], visits: data["domains"][currDomain]["visits"] };
        } else {
          // add
          data["domains"][currDomain] = { time: time, productive: false, visits: 1 };
        }
      }
      user.set(data);
    }
    listOfDomainsToUpdate = new Array(); // clear list
  });
};

async function getDomains() {
  const db = firebase.firestore();
  const user = db.collection('users').doc('user_0');

  userData = await user.get();

  return userData.data();
}

// handles change in url for a tab
const handleUpdate = (tabId, changeInfo, tab) => {
  const url = changeInfo.url;

  if (url === "undefined" || url == null){
    return;
  }
  
  let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  let domain = matches && matches[1];

  if (curPage.domain === domain){
    return;
  }
  
  var urlParts = url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/);
  cleanDomain = urlParts[0];
  addURL(cleanDomain);

  updatecurPage(domain, tabId);
};

// handles when a user changes active tab
const handleChangeTab = (obj) => {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    let url = tabs[0].url;
    let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    let domain = matches && matches[1];
    updatecurPage(domain, tabs[0].id);
  });
};

// updates curPage details and map of times
const updatecurPage = (domain, tabId) => {

  const currTime = new Date();

  // update dictionary
  if (curPage.domain){
    if (map.has(curPage.domain)){
      const oldTime = map.get(curPage.domain);
      map.set(curPage.domain, oldTime + (currTime- curPage.begin));
    } else {
      map.set(curPage.domain, (currTime - curPage.begin));
    }
    listOfDomainsToUpdate.push(curPage.domain);
  }

  // update curPage
  curPage.domain = domain;
  curPage.begin = new Date(); 
  curPage.tabId = parseInt(tabId);
}

// connects background.js to popup.js
chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
       console.log("background message recieved " + msg);
       port.postMessage(curPage.domain);
  });
});

function addURL(domain) {
  sitesList = getDomains();
  console.log(domain);
  sitesList.then(sitesList_ => {
    tempMap = new Map(Object.entries(sitesList_["domains"]));

    if (!tempMap.has(domain)) {
      const db = firebase.firestore();
      var userRef = db.collection("users").doc("user_0");
      var domainString = "domains." + domain;
      sitesList_["domains"][domain] = { time: 0, productive: false, visits: 1 };
      userRef.set(sitesList_);
    }
    else {
      incrementDomainVisits(domain);
    }
  })
}


/*
 * Other initializations
 */


setInterval(tick, 1000);
// updates database every minute; only reduce time for testing as there will be many writes
setInterval(updateDatabaseWithDomainTimes, 60000);
chrome.tabs.onUpdated.addListener(handleUpdate);
chrome.tabs.onActivated.addListener(handleChangeTab);


window.onload = function () {
  initApp();
};
