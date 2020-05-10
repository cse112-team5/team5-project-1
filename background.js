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
    
    var keys = Object.keys(domains);

    keys.forEach(key => {
      if (key === domain) {

        vis = domains[key]["visits"];
        tim = domains[key]["time"]; 
        prod = domains[key]["productive"];
      }
    })
    
    if(vis == -1) return 1; // couldn't find the domain

    sitesList = getDomains();
    
    sitesList.then(sitesList_ => {
      var userRef = db.collection("users").doc("user_0");
      sitesList_["domains"][domain] = { time: tim + increment, productive: prod, visits: vis };
      userRef.set(sitesList_);
      return 0;
    })
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
    
    var keys = Object.keys(domains);

    keys.forEach(key => {
      if (key === domain) {

        vis = domains[key]["visits"];
        tim = domains[key]["time"]; 
        prod = domains[key]["productive"];
      }
    })
    
    if(vis == -1) return 1; // couldn't find the domain

    sitesList = getDomains();
    
    sitesList.then(sitesList_ => {
      var userRef = db.collection("users").doc("user_0");
      sitesList_["domains"][domain] = { time: tim, productive: prod, visits: vis + 1 };
      userRef.set(sitesList_);
      return 0;
    })
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
    if (totalTime == 0) return -1;

    return (prodTime / totalTime) * 100;
  })
  return 0;
}



/*
 * Client side functions
 */

var curPage = {};


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

  const timeSinceBegin = formatDuration(new Date() - curPage.begin);
  chrome.browserAction.setBadgeText({ 'tabId': parseInt(curPage.tabId), 'text': timeSinceBegin });
};

async function getDomains() {
  const db = firebase.firestore();
  const user = db.collection('users').doc('user_0');

  userData = await user.get();

  return userData.data();
}

const handleUpdate = (tabId, changeInfo, tab) => {

  const domain = changeInfo.url;
  if (domain === undefined)
    return;
  if (curPage.domain === domain)
    return;

  curPage.domain = domain;
  curPage.begin = new Date();
  curPage.tabId = tabId;

  var urlParts = domain.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/);
  cleanDomain = urlParts[0];
  addURL(cleanDomain);
};

function addURL(domain) {
  sitesList = getDomains();
  console.log(domain);
  sitesList.then(sitesList_ => {
    tempMap = new Map(Object.entries(sitesList_["domains"]));
    if (!tempMap.has(domain)) {

      const db = firebase.firestore();
      var userRef = db.collection("users").doc("user_0");
      var domainString = "domains." + domain;
      sitesList_["domains"][domain] = { time: 0, productive: false, visits: 0 };
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
chrome.tabs.onUpdated.addListener(handleUpdate);

window.onload = function () {
  initApp();
};
