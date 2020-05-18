/*
 * Globals
*/

var portAuth;

/*
 * Firebase response handlers
 */


function initApp() {
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(function(user) {
    // create the user if new
    createUser();
  });
}

/*
 * Firebase authentication
 */

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

const loginGmail = () => {
  firebase.auth().signInWithPopup(provider).then((result) => {
    var user = result.user;
    console.log('Logged in', user);
    portAuth.postMessage({
      res: 'logged-in',
      email: user.email, uid: user.uid
    });

    // TODO Thomas, Jason
    // I've removed the firebase ui since background.js is now in charge of
    // launching gmail popups. I couldn't figure out how to get firebaseui to
    // delegate that task to background.js. According to
    // https://firebase.google.com/docs/auth/web/google-signin#authenticate_with_firebase_in_a_chrome_extension
    // we should be making our signin call in background.js anyways.
    //
    // you can move whatever logic you had in that callback function in that ui
    // config here.
  }).catch((error) => {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    var email = error.email;
    console.log (errorCode, errorMessage, email);
  });
};

const sendAuthContext = () => {
  const user = firebase.auth().currentUser;
  var email = null;
  var uid = null;

  if (user) {
    email = user.email;
    uid = user.uid;
  }

  console.log("SENDING MSG");
  portAuth.postMessage({
    res: 'auth-context',
    loggedIn: user !== null, email: email, uid: uid
  });
};

/*
 * Firebase communcation API
 */

const createUser = () => {
  // if we're not logged in, return
  const user = firebase.auth().currentUser;
  if (!user) return;

  // TODO replace with Madhav's code


};

/*
 * NOTE: Since we haven't implemented authentication yet, the following API calls should assume a global
 * user, 'user_0'. Once we've implemented user auth, the API calls below can grab the user id from the
 * Firebase auth object. So, there's no need to pass in user id as a parameter as long as the user is
 * logged in.
 */

function initApp() {
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(function(user) {
    console.log('User state change detected from the Background script of the Chrome Extension:', user);
  });
}


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
  if (domain.length === 0) return -1;

  const db = firebase.firestore();

  var vis = -1;
  var tim = 0;
  var prod = false;

  // TODO (Madhav, Xianhai)
  // Update for the logged in user
  //
  // Instead of 'user_0', use the uid of the currently logged in user.
  // In addition, add a check at the beggining of this function, returning
  // if there is no logged in user
  //
  // NOTE: use firebase.auth().currentUser.uid as the identifier
  db.collection('users').doc('user_0').get().then((snapshot) => {
    var domains = snapshot.data()["domains"];

    if (domain in domains) {
      vis = domains[domain]["visits"];
      tim = domains[domain]["time"];
      prod = domains[domain]["productive"];
    }
    else {
      vis = 0;
      tim = 0;
      prod = true;
    }

    var sitesList = snapshot.data();

    var userRef = db.collection("users").doc("user_0");
    console.log("incrementing activity time for " + domain + " by " + increment);
    sitesList["domains"][domain] = { time: tim + increment, productive: prod, visits: vis };
    userRef.set(sitesList);
    return 0;
  });
};

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
  if (domain.length === 0) return -1;

  const db = firebase.firestore();

  var vis = -1;
  var tim = 0;
  var prod = false;
  // TODO (Madhav, Xianhai)
  // Update for the logged in user
  //
  // Instead of 'user_0', use the uid of the currently logged in user.
  // In addition, add a check at the beggining of this function, returning
  // if there is no logged in user
  //
  // NOTE: use firebase.auth().currentUser.uid as the identifier
  db.collection('users').doc('user_0').get().then((snapshot) => {
    var domains = snapshot.data()["domains"];

    if (domain in domains) {
      vis = domains[domain]["visits"];
      tim = domains[domain]["time"];
      prod = domains[domain]["productive"];
    }
    else {
      vis = 1;
      tim = 0;
      prod = true;
    }

    var sitesList = snapshot.data();

    console.log("incrementing visits for " + domain);
    var userRef = db.collection("users").doc("user_0");
    sitesList["domains"][domain] = { time: tim, productive: prod, visits: vis + 1 };
    userRef.set(sitesList);
    return 0;
  });
};

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
const getProductivity = async () => {
  const db = firebase.firestore();

  // TODO (Madhav, Xianhai)
  // Update for the logged in user
  //
  // Instead of 'user_0', use the uid of the currently logged in user.
  // In addition, add a check at the beggining of this function, returning
  // if there is no logged in user
  //
  // NOTE: use firebase.auth().currentUser.uid as the identifier
  var snapshot = await db.collection('users').doc('user_0').get();


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
  });
  console.log("Total time = " + totalTime + ", Productive time = " + prodTime);
  console.log("Productivity = " + (prodTime / totalTime) * 100 + "%");

  if (totalTime === 0) return -1; // cannot divide by zero, return error

  return (prodTime / totalTime) * 100;
};



/*
 * Client side functions
 */

var curPage = {};
var map = new Map();
var domainsToUpdate = new Map();

const updateDatabaseWithDomainTimes = () =>{
  const currTime = new Date();
  if (map.has(curPage.domain)){
    const oldTime = map.get(curPage.domain);
    map.set(curPage.domain, oldTime + (currTime- curPage.begin));
  } else {
    map.set(curPage.domain, (currTime - curPage.begin));
  }

  if (domainsToUpdate.has(curPage.domain)){
    const oldTime = domainsToUpdate.get(curPage.domain);
    domainsToUpdate.set(curPage.domain, oldTime + (currTime- curPage.begin));
  } else {
    domainsToUpdate.set(curPage.domain, (currTime - curPage.begin));
  }

  curPage.begin = currTime; // reset start time for current active domain
  console.log(domainsToUpdate);
  domainsToUpdate.forEach((increment, domain, map) => {
    // convert to seconds
    console.log("DOM " + domain);
    //TODO figure out why domain is undefined
    if (domain === undefined || domain === null) return;
    incrementDomainActivity(domain, Math.floor(increment / 1000));
  });
  domainsToUpdate = new Map(); // clear list
};

async function getDomains() {
  const db = firebase.firestore();
  // TODO (Madhav, Xianhai)
  // Update for the logged in user
  //
  // Instead of 'user_0', use the uid of the currently logged in user.
  // In addition, add a check at the beggining of this function, returning
  // if there is no logged in user
  //
  // NOTE: use firebase.auth().currentUser.uid as the identifier
  const user = db.collection('users').doc('user_0');

  userData = await user.get();

  return userData.data();
}

// handles change in url for a tab
const handleUpdate = (tabId, changeInfo, tab) => {
  const url = changeInfo.url;

  if (url === undefined || url == null){
    return;
  }

  var urlParts = url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/);
  cleanDomain = urlParts[0];

  if (curPage.domain === cleanDomain) {
    return;
  }

  addURL(cleanDomain);
  updatecurPage(cleanDomain, tabId);
};

// handles when a user changes active tab
const handleChangeTab = (obj) => {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    let url = tabs[0].url;
    var urlParts = url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/);
    domain = urlParts[0];
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

    if (domainsToUpdate.has(curPage.domain)){
      const oldTime = map.get(curPage.domain);
      domainsToUpdate.set(curPage.domain, oldTime + (currTime- curPage.begin));
    } else {
      domainsToUpdate.set(curPage.domain, (currTime - curPage.begin));
    }
  }

  // update curPage
  curPage.domain = domain;
  curPage.begin = new Date();
  curPage.tabId = parseInt(tabId);
};

// connects background.js to popup.js
chrome.extension.onConnect.addListener(function(port) {
  console.log("NAME ?",port.name, port.name === 'auth');
  if (port.name === 'auth') {
    portAuth = port;
    portAuth.onMessage.addListener(function(msg) {
      if (msg.task === 'login-gmail') {
        loginGmail();
      }
      else if (msg.task === 'get-auth-context') {
        sendAuthContext();
      }
    });
  }
  else {
    port.onMessage.addListener(function(msg) {
      console.log("background message recieved " + msg);
      port.postMessage(curPage.domain);
    });
  }
});

function addURL(domain) {
  sitesList = getDomains();
  console.log(domain);
  sitesList.then(sitesList_ => {
    tempMap = new Map(Object.entries(sitesList_["domains"]));

    if (!tempMap.has(domain)) {
      const db = firebase.firestore();
      // TODO (Madhav, Xianhai)
      // Update for the logged in user
      //
      // Instead of 'user_0', use the uid of the currently logged in user.
      // In addition, add a check at the beggining of this function, returning
      // if there is no logged in user
      //
      // NOTE: use firebase.auth().currentUser.uid as the identifier
      var userRef = db.collection("users").doc("user_0");
      //var domainString = "domains." + domain;
      sitesList_["domains"][domain] = { time: 0, productive: false, visits: 1 };
      userRef.set(sitesList_);
    }
    else {
      incrementDomainVisits(domain);
    }
  });
}

// update the productivity periodically
const handleProductivity = async () => {
  const newProd = await getProductivity();
  console.log("NEW PROD " + newProd);
  chrome.storage.sync.set({productivity: newProd});
};

/*
 * Other initializations
 */


// updates database every minute; only reduce time for testing as there will be many writes
setInterval(handleProductivity, 3000);
setInterval(updateDatabaseWithDomainTimes, 5000);
chrome.tabs.onUpdated.addListener(handleUpdate);
chrome.tabs.onActivated.addListener(handleChangeTab);


window.onload = function () {
  initApp();
};
