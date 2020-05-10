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
  appId: "TODO",
  measurementId: "TODO"
};

firebase.initializeApp(config);

const initApp = () => {
  // Listen for auth state changes.
  // TODO: we'll implement this later when we startw working on user auth
  firebase.auth().onAuthStateChanged(function(user) {
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
 * TODO
 * Increments the time spent on a domain for the user
 *
 * paremeters:
 *      domain (string) - domain for which we're incrementing (e.g. 'reddit.com')
 *      increment (int) - the additional (active) time in seconds spent on the site (non-negative)
 *
 * return
 *      0 upon success, 1 otherwise
 */
const incrementDomainActivity = () => {
  return 0;
}

/*
 * TODO
 * Increments the number of visites on a domain for the user by one
 *
 * paremeters:
 *      domain (string) - domain for which we're incrementing (e.g. 'reddit.com')
 *
 * return
 *      0 upon success, 1 otherwise
 */
const incrementDomainVisits = () => {
  return 0;
}

/*
 * TODO
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
  return 0;
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

// handles change in url for a tab
const handleUpdate = (tabId, changeInfo, tab) => {
  console.log("updated tab");
  const url = changeInfo.url;

  if (url === "undefined" || url == null){
    return;
  };

  let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  let domain = matches && matches[1];

  if (curPage.domain === domain){
    return;
  }

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
})


/*
 * Other initializations
 */


setInterval(tick, 1000);
// updates database every minute; only reduce time for testing as there will be many writes
setInterval(updateDatabaseWithDomainTimes, 60000);
chrome.tabs.onUpdated.addListener(handleUpdate);
chrome.tabs.onActivated.addListener(handleChangeTab);


window.onload = function() {
  initApp();
};
