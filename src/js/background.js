
/*
 * Globals
 */

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
