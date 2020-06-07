/* eslint-disable no-unused-vars */
/*Globals*/
/* eslint-disable no-unused-vars */
var userLoggedIn = false;
var userEmail = undefined;
var userUid = undefined;

var teamContext = null;
var userContext = null;
var renderContext = null;

/* eslint-enable no-unused-vars */

/** Messaging logistics*/

// port for authentication related communication
const portAuth = chrome.extension.connect({ name: "auth" });
portAuth.onMessage.addListener((msg) => {
  // nothing here for now
});


const handleLoginEmail = () => { };

const handleLoginGmail = () => {
  console.log("GMAIL");
  portAuth.postMessage({ task: "login-gmail" });
};

// port for user data related communication
const portUserData = chrome.extension.connect({ name: "user-data" });
portUserData.onMessage.addListener((msg) => {
  if (msg.res === "send-context") {
    userContext = {
      loggedIn: msg.loggedIn,
      id: msg.uid,
      email: msg.email,
      productivity: msg.userProductivity,
      domains: msg.userDomains,
      timeWasted: msg.userTimeWasted,
      badgesArr: msg.userBadges
    };
    teamContext = { id: msg.teamId, name: msg.teamName, inviteCode: msg.teamInviteCode, membersData: msg.membersData };
    refresh();
  }
});

// grabs the context from background.js
const getContext = () => {
  portUserData.postMessage({ task: "get-context" });
};

// port for team data related information
const portTeamData = chrome.extension.connect({ name: "team-data" });
portTeamData.onMessage.addListener((msg) => {
  // nothing for now
});

/* Client UI handlers */

//sets up the checkbox to be checked if distracting
const setUpCheckbox = () =>{
  var productiveBool = false;
  var domainExists = false;
  for (var i = 0; i < userContext.domains.length; i++){
    if (userContext.domains[i][0] === renderContext.currentDomain){
      productiveBool = userContext.domains[i][1].productive;
      domainExists = true;
    }
    else if ("www." + userContext.domains[i][0] === renderContext.currentDomain){
      productiveBool = userContext.domains[i][1].productive;
      domainExists = true;
    }
  }

  if(productiveBool === true || !domainExists)
    document.getElementById("productive").checked = false; //toggle off
  else
    document.getElementById("productive").checked = true; //toggle on
};

const updatecurrentDomain = () => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    let url = tabs[0].url;
    // regex to split url from domain
    let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    let domain = matches && matches[1];
    renderContext.currentDomain = domain;
  });
};

// listens to slider and tells api.js to update productivity field
const updateDomainProductiveHandler = () => {
  var currentDomain = renderContext.currentDomain;
  // checkbox = true means distracting site so we must flip the bool
  productiveBool = !(document.getElementById("productive").checked);
  if (!renderContext.currentDomain) {
    console.error("[ERR] updateDomainProductiveHandler: currentDomain is null");
    return;
  }
  // sanitize currentDomain
  var urlParts = renderContext.currentDomain.replace("http://", "").replace("https://", "").replace("www.", "").split(/[/?#]/);
  currentDomain = urlParts[0];
  var list = [];
  var domainObj = {
    url: currentDomain,
    productive: productiveBool,
    time: null,
    visits: null
  };
  list.push(domainObj);
  portUserData.postMessage({
    task: "update-domain-productive",
    domains: list
  });
};

const joinTeamHandler = () => {
  if (teamContext.id) {
    showError();
    return;
  }
  const inviteCode = document.getElementById("invite-code").value;
  if (inviteCode.length !== INVITE_CODE_LENGTH) {
    return;
  }
  portTeamData.postMessage({ task: "join-team", inviteCode: inviteCode });
};

const createTeamHandler = () => {
  if (teamContext.id) {
    showError();
    return;
  }
  const teamName = document.getElementById("new-team-name").value;
  portTeamData.postMessage({ task: "create-team", teamName: teamName });
};

const leaveTeamHandler = () => {
  if (!teamContext.id) {
    showError();
    return;
  }
  portTeamData.postMessage({ task: "leave-team" });
};

// TODO figure out a way to consolidate this into one function,
// that way we can switch over the argument rather than having
// seperate functions for each screen
const switchScreenMyTeamHandler = () => {
  renderContext.currentScreen = SCREEN_MY_TEAM;
  refresh();
};

const switchScreenMyStatsHandler = () => {
  renderContext.currentScreen = SCREEN_MY_STATS;
  refresh();
};

const badgesToggleHandler = () => {
  renderContext.showBadges = document.getElementsByClassName("badges-toggle")[0].checked;
  refresh();
};

/* HTML rendering*/

const refresh = () => {
  const loginOptions = document.getElementsByClassName("login-options")[0];
  const userInfo = document.getElementsByClassName("user-info")[0];

  if (userContext.loggedIn) {
    showScreenTabs(); // display the screen tabs

    // we're logged in, so display the user info
    loginOptions.style.display = "none";
    userInfo.style.display = "block";
    document.getElementsByClassName("result-email")[0].innerHTML = "Logged in as: " + userContext.email;

    console.log("REFRESH", renderContext.currentScreen);
    if (renderContext.showBadges) {
      showBadges();
    } else {
      hideElement("my-badges");
    }

    if (renderContext.currentScreen === SCREEN_MY_STATS) {
      // display the user's stats
      showMyStats();
      showRecommendation();
      setUpCheckbox();
      hideElement("team-formation");
      hideElement("team-info");
      hideElement("team-leaderboard");
    }
    else {
      // show our current team if we're part of one, otherwise show the
      // team formation elements
      if (teamContext.id) {
        hideElement("team-formation");
        showInviteCode();
        showLeaderBoard();
      }
      else {
        showTeamFormation();
        hideElement("team-info");
        hideElement("team-leaderboard");
      }

      hideElement("my-stats");
      hideRecommendation();
    }
  }
  else {
    // hide the screen tabs
    hideElement("screen-tabs");

    // we're not logged in, so display the login options
    loginOptions.style.display = "block";
    userInfo.style.display = "none";

    hideElement("team-formation");
    hideElement("team-info");
    hideElement("team-leaderboard");

    // hide the user's stats
    hideElement("my-stats");

    hideElement("my-badges");
    hideRecommendation();
  }
};

const initialize = () => {
  // initialize html element listeners
  document.getElementsByClassName("screen-tabs-my-stats")[0].addEventListener("click", switchScreenMyStatsHandler);
  document.getElementsByClassName("screen-tabs-my-team")[0].addEventListener("click", switchScreenMyTeamHandler);
  document.getElementById("leave-team-button").addEventListener("click", leaveTeamHandler);
  document.getElementById("new-team").addEventListener("click", createTeamHandler);
  document.getElementById("join-team").addEventListener("click", joinTeamHandler);
  document.getElementsByClassName("login-email")[0].addEventListener("click", handleLoginEmail);
  document.getElementsByClassName("login-gmail")[0].addEventListener("click", handleLoginGmail);
  document.getElementsByClassName("badges-toggle")[0].addEventListener("click", badgesToggleHandler);
  document.getElementById("productive").addEventListener("click", updateDomainProductiveHandler);

  // set default screen
  renderContext = { currentScreen: SCREEN_MY_STATS, currentDomain: null, showBadges: true };
  // other initializations
  updatecurrentDomain();
};

// initialize some handlers when the DOM has loaded
document.addEventListener("DOMContentLoaded", function () {
  initialize();
});

// request initial context when the popup is loading
getContext();
