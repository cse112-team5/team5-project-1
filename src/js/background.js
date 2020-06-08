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

    if (userContext.teamId) {
      teamContext = await getTeam(userContext.teamId);
      updateMyTeam();
    }

    // add handlers to keep data up to date
    updateStats();
    setInterval(updateStats, UPDATE_DELAY);
    // NOTE if you decrease this timer while testing,
    // be sure to bring it back up later
    setInterval(updateMyTeam, UPDATE_DELAY);
    setInterval(updateDatabaseWithDomainTimes, UPDATE_DELAY);
    setInterval(triggerBadges, UPDATE_DELAY);
    chrome.tabs.onUpdated.addListener(handleUpdate);
    chrome.tabs.onActivated.addListener(handleChangeTab);

    sendContext();
  });
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
  console.log("[NOTE] updateDatabaseWithDomainTimes: Updating the following domains:", domainsToUpdate);
  domainsToUpdate.forEach((increment, domain, map) => {
    // convert to seconds
    if (domain === undefined || domain === null) return;
    incrementDomainActivity(domain, Math.floor(increment / NUM_MILLISECONDS_IN_SECONDS));
  });
  domainsToUpdate = new Map(); // clear list
};

// handles change in url for a tab
const handleUpdate = (tabId, changeInfo, tab) => {
  const url = changeInfo.url;

  if (url === undefined || url == null){
    return;
  }

  var urlParts = url.replace("http://", "").replace("https://", "").replace("www.", "").split(/[/?#]/);
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
    var urlParts = url.replace("http://", "").replace("https://", "").replace("www.", "").split(/[/?#]/);
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

const addURL = async (domain) => {
  const user = firebase.auth().currentUser;

  if (!user) {
    // No user is signed in.
    console.error("[ERR] addURL: Not signed in");
    return 1;
  }
  // User is signed in.
  userDomains = await getDomains(user);
  incrementDomainVisits(domain);
};


// update the productivity periodically
const updateStats = async () => {
  const user = firebase.auth().currentUser;
  if (!user) {
    return;
  }

  console.log("[NOTE] updateStats: updating");
  // user is signed in.
  const newStats = await getUserStats();
  if (!newStats) return;

  // this can be null, which should display as "N/A" in popup.js
  userContext.productivity = newStats.productivity;
  userContext.domains = sortDomains(newStats.domains);
  userContext.badges = newStats.badges;
  userContext.timeWasted = newStats.timeWasted;

  sendContext();
};

const updateMyTeam = async () => {
  const user = firebase.auth().currentUser;
  if(!user || !teamContext || !teamContext.members) {
    return;
  }

  console.log(teamContext);
  let list = await Promise.all(teamContext.members.map(async (uid)=>{
    let temp = await getUserStatsHelper(uid);
    if(temp && temp.domains) { delete temp.domains; }
    return temp;
  }));

  teamContext.membersData = list.sort(function comp(a, b) {
    return b.productivity - a.productivity;
  });
  console.log(teamContext.membersData);
  sendContext();
};

const triggerBadges = () => {
  triggerNewMember();
  triggerNumProductivity();
  triggerLeastTimeWasted();
  triggerMostProductive();
};

/*
 * Other initializations
 */


window.onload = function () {
  initApp();
};
