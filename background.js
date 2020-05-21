/*
 * Tools
 */


const testfunc = () => {
  return "TEST FUNC";
}
function generateId(len) {
  var alphanum = 'ABCDEFGHIJKLMNOPQRSTUV0123456789'.split(''),
    n = alphanum.length

  for(var i = n - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var tmp = alphanum[i]
    alphanum[i] = alphanum[j]
    alphanum[j] = tmp
  }

  var code = []
  for (let i = 0; i < len; i++)
    code.push(alphanum[Math.floor(Math.random() * n)])
  return code.join('')
}

/*
 * Globals
 */

var portAuth = null;
var portUserData = null;
var teamContext = null;
var userContext = null;

/*
 * Firebase response handlers
 */


const initApp = () => {
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;

    // create the user if new
    userContext = await createUser();
    if (userContext.teamId)
      teamContext = await getTeam(userContext.teamId);
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

// popup.js will need context surrounding the current state of the app
const sendContext = () => {
  const user = firebase.auth().currentUser;
  var email = null;
  var uid = null;
  var teamId = null;
  var teamName = null;
  var teamInviteCode = null;

  // user info if logged in
  if (user) {
    email = user.email;
    uid = user.uid;
  }

  // team info if part of team
  if (teamContext) {
    teamId = teamContext.id;
    teamName = teamContext.name;
    teamInviteCode = teamContext.inviteCode;
  }

  portUserData.postMessage({
    res: 'send-context',
    loggedIn: user !== null, email: email, uid: uid,
    teamId: teamId, teamName: teamName, teamInviteCode: teamInviteCode,
  });
};

/*
 * Firebase communcation API
 */


/*
 * Create user
 *
 * paremeters:
 *      none
 *
 * return
 *      the user context if successful, null otherwise
 */
const createUser = async () => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) {
    // No user is signed in.
    console.error("[ERR] createUser: Not signed in");
    return null;
  }

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();

    if (userDoc.exists) {
      // user document exists
      return { id: userDoc.id, teamId: userDoc.data().teamId };
    } else { // user document doesn't exist, create it
      console.log("[NOTE] createUser: User doesn't exist. Creating doc for user.");
      db.collection('users').doc(user.uid).set({
        domains: {},
        teamId: null
      });

      return { id: userDoc.id, teamId: null };
    }
  } catch (error) {
    console.error("[ERR] createUser:", error);
  }

  return null;
};

/*
 * NOTE: Since we haven't implemented authentication yet, the following API calls should assume a global
 * user, 'user_0'. Once we've implemented user auth, the API calls below can grab the user id from the
 * Firebase auth object. So, there's no need to pass in user id as a parameter as long as the user is
 * logged in.
 */

const getDomains = async () => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) {
    // No user is signed in.
    console.error("[ERR] getDomains: Not signed in");
    return null;
  }

  // user is signed in.
  try {
    const docRef = await db.collection('users').doc(user.uid).get();
    if (!docRef.exists) { // user document exists
      throw new Error("No such document");
    }

    return docRef.data().domains;
  } catch (error) {
    console.error("[ERR] getDomains:", error);
  }

  return null;
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
  const user = firebase.auth().currentUser;

  if (!user) {
    // No user is signed in.
    console.error("[ERR] incrementDomainActivity: Not signed in");
    return 1;
  }

  var vis = -1;
  var tim = 0;
  var prod = false;

  var ref = db.collection('users').doc(user.uid);

  ref.get().then(function(doc) {

    if (doc.exists) { // user document exists
      console.log("Document data:", doc.data());
    } else { // user document doesn't exist, create it
      console.log("No doc found! Creating doc for user.");
      db.collection('users').doc(user.uid).set({
        domains: {},
        teamId: null
      });
      //return -1;
    }
  }).catch(function(error) { // some error occurred
    console.log("Error getting document:", error);
    return -1;
  });

  // User is signed in.
  db.collection('users').doc(user.uid).get().then((snapshot) => {
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

    var userRef = db.collection("users").doc(user.uid);
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
  const user = firebase.auth().currentUser;

  if (!user) {
    // No user is signed in.
    console.error("[ERR] incrementDomainVisits: Not signed in");
    return 1;
  }

  var vis = -1;
  var tim = 0;
  var prod = false;

  // User is signed in.
  var ref = db.collection('users').doc(user.uid);

  ref.get().then(function(doc) {
    if (doc.exists) { // user document exists
      console.log("Document data:", doc.data());
    } else { // user document doesn't exist
      console.log("No doc found! Creating doc for user.");
      db.collection('users').doc(user.uid).set({
        domains: {},
        teamId: null
      });
    }
  }).catch(function(error) { // some error occurred
    console.log("Error getting document:", error);
    return -1;
  });

  db.collection('users').doc(user.uid).get().then((snapshot) => {
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

    console.log("incrementing visits for " + domain);
    var userRef = db.collection("users").doc(user.uid);
    sitesList["domains"][domain] = { time: tim, productive: prod, visits: vis + 1 };
    userRef.set(sitesList);
    return 0;
  });
  return 0;
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
const getProductivity = async (user) => {
  const db = firebase.firestore();
  var snapshot;
  // Update for the logged in user
  //
  var docRef = db.collection('users').doc(user.uid);

  docRef.get().then(function(doc) {
    if (doc.exists) { // user document exists
      console.log("Document data:", doc.data());
    } else { // user document doesn't exist
      db.collection('users').doc(user.uid).set({
        domains: {},
        teamId: null
      });
    }
  }).catch(function(error) { // some error occurred
    console.log("Error getting document:", error);
    return -1;
  });

  snapshot = await db.collection('users').doc(user.uid).get();
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
 * Get a team
 *
 * paremeters:
 *      team name
 *
 * return
 *      the team context if successful, null otherwise
 */
const getTeam = async (teamId) => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) return null;
  try {
    const teamDoc = await db.collection("teams").doc(teamId).get();

    // return relevant data
    return {id: teamDoc.id, ...teamDoc.data()};
  } catch (error) {
    console.error("[ERR] getTeam:", error);
  }
}

/*
 * Create a team
 *
 * paremeters:
 *      team name
 *
 * return
 *      the team context if successful, null otherwise
 */
const createTeam = async (teamName) => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) return null;
  try {
    const docRef = await db.collection('teams').add({
      name: teamName,
      members: [],
      inviteCode: generateId(8),
    });
    const userDoc = await db.collection('teams').doc(docRef.id).get();

    // return relevant data
    return {id: docRef.id, ...(userDoc.data())};
  } catch (error) {
    console.error("[ERR] createTeam:", error);
  }

  return null;
}

/*
 * Join a team through invite
 *
 * paremeters:
 *      invite code
 *
 * return
 *      the team context if successful, null otherwise
 */
const joinTeam = async (teamId, inviteCode) => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) return null
  try {
    var teamDoc = null;

    if (teamId) {
      teamDoc = await db.collection("teams").doc(teamId).get();
    }
    else {
      const qs = await db.collection("teams").where("inviteCode", "==", inviteCode).get();
      if (qs.size === 1){
        qs.forEach((doc) => {
          teamDoc = doc;
        });
      }
      else throw new Error("Error with invite code");
    }

    const members = teamDoc.data().members;
    members.push(user.uid);
    db.collection("teams").doc(teamDoc.id).update({members: members});
    db.collection("users").doc(user.uid).update({teamId: teamDoc.id});

    // return relevant data
    return {id: teamDoc.id, ...teamDoc.data()};

  } catch (error) {
    console.error("[ERR] joinTeam:", error);
  }

  return null;
}

/*
 * Leave the current team
 *
 * paremeters:
 *      none
 *
 * return
 *      true if successful, false otherwise
 */
const leaveTeam = async () => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) return false
  try {
    // remove teamId on user document
    const userRef = await db.collection("users").doc(user.uid).get()
    var data = userRef.data();
    const teamId = data.teamId;
    data.teamId = null;
    db.collection("users").doc(user.uid).set(data);

    // remove user from members list on team document
    const teamRef = await db.collection("teams").doc(teamId).get();
    var data = teamRef.data();
    const userIndex = data.members.indexOf(user.uid);
    data.members.splice(userIndex, 1);
    db.collection("teams").doc(teamRef.id).set(data);

    return true;
  } catch (error) {
    console.error("[ERR] leaveTeam: ", error);
  }

  return false;
}

/*
 * Messaging logistics
 */

/*
 * When making firebase requests, PLEASE do so through background.js'
 * firebase instance. The one in popup.js will be removed,
 *
 * To perform a firebase request from popup.js, first decide on a port to
 * use, auth for authentication, user-data for data, etc. Create a new one
 * if none fit your liking. Then, create the appropriate handlers here.
 * First switch based on the port name, then switch based on the 'task'
 * item in the msg object. Then, call the appropriate function from there.
 *
 * Also, you must setup receiver handlers on the other end, look at the top
 * of popup.js for examples
 */
chrome.extension.onConnect.addListener(function(port) {
  console.log("NAME ?",port.name, port.name === 'auth');
  if (port.name === 'auth') {
    portAuth = port;
    portAuth.onMessage.addListener(function(msg) {
      if (msg.task === 'login-gmail') {
        loginGmail();
      }
    });
  } else if (port.name === 'user-data'){
    portUserData = port;
    portUserData.onMessage.addListener(function(msg) {
      if (msg.task === 'get-invite-code'){
        getInviteCode();
      } else if (msg.task === 'get-context'){
        sendContext();
      }
    });
  } else if(port.name === 'user-data-options'){
    portUserData = port;
    portUserData.onMessage.addListener(function(msg) {
      if (msg.task === 'get-user-id'){
        getUserId();
      }
    });
  } else if(port.name === 'team-data'){
    portTeamData = port;
    portTeamData.onMessage.addListener(function(msg) {
      if (msg.task === 'create-team'){
        createTeamHandler(msg.teamName);

      } else if (msg.task === 'join-team'){
        joinTeamHandler(msg.inviteCode);

      } else if (msg.task === 'leave-team'){
        leaveTeamHandler();

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

const createTeamHandler = async (teamName) => {
  // TODO fix this to make it more efficient can add the user when we create
  // the team
  const team = await createTeam(teamName);
  const res = await joinTeam(team.id, null);

  teamContext = team;

  sendContext();
}

const joinTeamHandler = async (inviteCode) => {
  const team = await joinTeam(null, inviteCode);

  teamContext = team;

  sendContext();
}

const leaveTeamHandler = async () => {
  const val = await leaveTeam();

  if (val) teamContext = null;

  sendContext();
}

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

/*
async function getDomains(user) {
  const db = firebase.firestore();
  // Update for the logged in user
  //
  var docRef = db.collection('users').doc(user.uid);

  docRef.get().then(function(doc) {

    if (doc.exists) { // user document exist
      console.log("Document data:", doc.data());
    } else { // user document doesn't exist
      console.log("No doc found! Creating doc for user.");
      db.collection('users').doc(user.uid).set({
        domains: {},
        teamId: null
      });
    }
  }).catch(function(error) { // some error occurred
    console.log("Error getting document:", error);
    return -1;
  });

  const userRef = db.collection('users').doc(user.uid);
  userData = await userRef.get();
  return userData.data();
}
*/

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
    if (tabs[0] === undefined){
      return;
    }
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

async function addURL(domain) {
  const user = firebase.auth().currentUser;

  if (!user) {
    // No user is signed in.
    console.error("[ERR] addURL: Not signed in");
    return 1;
  }
  // User is signed in.
  userDomains = await getDomains(user);
  incrementDomainVisits(domain);

  /*
  else {
  console.log(domain);
  sitesList.forEach(sitesList_ => {
    tempMap = new Map(Object.entries(sitesList_["domains"]));

    if (!tempMap.has(domain)) {
      const db = firebase.firestore();
      // Update for the logged in user
      //
      var docRef = db.collection('users').doc(user.uid);

      docRef.get().then(function(doc) {
        if (doc.exists) { // user document exists
          console.log("Document data:", doc.data());
        } else { // user document doesn't exist
          console.log("No doc found! Creating doc for user.");
          db.collection('users').doc(user.uid).set({
            domains: {},
            teamId: null
          });
        }
      }).catch(function(error) { // some error occurred
        console.log("Error getting document:", error);
        return -1;
      });

      const userRef = db.collection('users').doc(user.uid);
      sitesList_["domains"][domain] = { time: 0, productive: false, visits: 1 };
      userRef.set(sitesList_);

    }
    else {
      incrementDomainVisits(domain);
    }
  });
    */
}

function getUserId() {
  const user = firebase.auth().currentUser;
  if(user) {
    portUserData.postMessage({
      res: 'logged_in',
      user_uid: user.uid
    });
  }
}
function getInviteCode(){
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (user){
    db.collection("users").doc(user.uid).get()
      .then((docRef)=>{
        return docRef.get("teamId");
      })
      .then((teamId)=>{
        if (teamId == null){
          // no team
          portUserData.postMessage({
            res: 'invite-code-false',
          });
        } else {
          db.collection("teams").doc(teamId).get()
            .then((docRef) => {
              return docRef.get("inviteCode");
            })
            .then((invCode) =>{
              // return invite code
              portUserData.postMessage({
                res: 'invite-code-true',
                inviteCode: invCode
              });
            })
            .catch((error)=>{
              console.error("Getting Invite Code Error: ", error);
            });
        }
      })
      .catch(function (error) {
        console.log("Getting Invite Code Error: " + error);
      });
  }
}

// update the productivity periodically
const handleProductivity = async () => {
  firebase.auth().onAuthStateChanged(async function(user) {
    if (user) {
      // User is signed in.
      const newProd = await getProductivity(user);
      console.log("NEW PROD " + newProd);
      chrome.storage.sync.set({productivity: newProd});
    } else {
      // No user is signed in.
      console.log("not logged in");
    }
  });
};

/*
 * Other initializations
 */


// updates database every minute; only reduce time for testing as there will be many writes
//setInterval(handleProductivity, 3000);
//setInterval(updateDatabaseWithDomainTimes, 60000);
chrome.tabs.onUpdated.addListener(handleUpdate);
chrome.tabs.onActivated.addListener(handleChangeTab);


window.onload = function () {
  initApp();
};
