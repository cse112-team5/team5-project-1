/*
 * Globals
 */

var userLoggedIn = false;
var userEmail = undefined;
var userUid = undefined;

var teamContext = null;
var userContext = null;

/*
 * Firebase initializations
 */

/*
 * Messaging logistics
 */

// port for authentication related communication
const portAuth = chrome.extension.connect({ name: 'auth' });
portAuth.onMessage.addListener((msg) => {
  if (msg.res === 'logged-in') {
    userLoggedIn = true;
    userEmail = msg.email;
    userUid = msg.uid;
    renderHome();
  }
});


const handleLoginEmail = () => {};

const handleLoginGmail = () => {
  console.log("GMAIL");
  portAuth.postMessage({ task: 'login-gmail' });
};

// port for user data related communication
const portUserData = chrome.extension.connect({ name: 'user-data' });
portUserData.onMessage.addListener((msg) => {
  console.log("CONTEXT GET");
  if (msg.res === 'send-context') {
    userContext = { loggedIn: msg.loggedIn, id: msg.uid, email: msg.email };
    teamContext = { id: msg.teamId, name: msg.teamName, inviteCode: msg.teamInviteCode };
    refresh();
  }
});

// grabs the context from background.js
const getContext = () => {
  portUserData.postMessage({ task: 'get-context' });
};

// port for team data related information
const portTeamData = chrome.extension.connect({ name: 'team-data' });
portTeamData.onMessage.addListener((msg) => {
  if (msg.res === 'res-create-team') {
    createTeamResHandler();
  }
  else if (msg.res === 'res-join-team') {
    joinTeamResHandler();
  }
  else if (msg.res === 'res-leave-team') {
    leaveTeamResHandler();
  }
});

//ui.start('#firebaseui-auth-container', uiConfig);

/*
 * Client side functions
 */


function compareTime(a, b) {
  return b[1].time - a[1].time;
}


const updateProductivity = () => {
  //TODO calculate productivity with an API instead of dummy values
  chrome.storage.sync.get('productivity', (data) => {
    console.log(data);
    if (Object.keys(data).length === 0 || data.productivity < 0) {
      document.getElementById('p_score').innerHTML = "N/A";
    }
    else {
      document.getElementById('p_score').innerHTML = data.productivity + "%";
    }
  });
};


function updateCurrentDomain(){
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    let url = tabs[0].url;
    // regex to split url from domain
    let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    let domain = matches && matches[1];
    this.document.getElementById('domain').innerHTML = domain;
  });
}

function sortDomains(data) {
  tempMap = new Map(Object.entries(data["domains"]));
  return [...tempMap.entries()].sort(compareTime);
}

function updateSites(sitesList) {
  sitesList.then(sitesList_ => {
    sortedDomains = sortDomains(sitesList_);

    console.log(sortedDomains);

    var MAX_SITES = 5;
    var numSites = sortedDomains.length < MAX_SITES ? sortedDomains.length : MAX_SITES;

    var list = document.createElement('ol');
    for (var i = 0; i < numSites; i++) {
      var item = document.createElement('li');
      item.appendChild(document.createTextNode(sortedDomains[i][0]));
      list.appendChild(item);
    };

    document.getElementById("topsites").innerHTML = "Top " + numSites + " visted sites";
    document.getElementById('sitesList').appendChild(list);
  });

}


function joinTeamHandler() {
  const inviteCode = document.getElementById("invite-code").value;
  if (inviteCode.length !== 8) {
    return;
  }
  portTeamData.postMessage({ task: 'join-team', inviteCode: inviteCode });
}

function joinTeamResHandler(teamId, inviteCode) {
  showInviteCode();
  hideTeamFormation();
}

function createTeamHandler() {
  console.log("CREATE TEAM");
  const teamName = document.getElementById('new-team-name').value;
  portTeamData.postMessage({ task: 'create-team', teamName: teamName });
}

function createTeamResHandler(teamId, inviteCode) {
  showInviteCode();
  hideTeamFormation();
}

function leaveTeamHandler(){
  portTeamData.postMessage({ task: 'leave-team' });
}

function leaveTeamResHandler() {
  hideInviteCode();
  showTeamFormation();
}

function showInviteCode(){
  const teamInfo = document.getElementsByClassName('team-info')[0];
  teamInfo.style.display = "block";
  document.getElementById('team-name').innerHTML = "Team name: " + teamContext.name;
  document.getElementById('team-invite-code').innerHTML = "Team invite code: " + teamContext.inviteCode;
}

function hideInviteCode() {
  const teamInfo = document.getElementsByClassName('team-info')[0];
  teamInfo.style.display = "none";
}

function hideTeamFormation() {
  const teamFormation = document.getElementById("team-formation");
  teamFormation.style.display = "none";
}

function showTeamFormation(){
  const teamFormation = document.getElementById("team-formation");
  teamFormation.style.display = "block";
}


/*
 * HTML rendering
 */


const refresh = () => {
  const loginOptions = document.getElementsByClassName('login-options')[0];
  const userInfo = document.getElementsByClassName('user-info')[0];

  if (userContext.loggedIn) {
    // we're logged in, so display the user info
    loginOptions.style.display = "none";
    userInfo.style.display = "block";
    document.getElementsByClassName('result-email')[0].innerHTML = userContext.email;
    document.getElementsByClassName('result-uid')[0].innerHTML = userContext.id;

    if (teamContext.id) {
      hideTeamFormation();
      showInviteCode();
    }
    else {
      showTeamFormation();
      hideInviteCode();
    }
  }
  else {
    // we're not logged in, so display the login options
    loginOptions.style.display = "block";
    userInfo.style.display = "none";

    hideTeamFormation();
    hideInviteCode();
  }
};

const initializeListeners = () => {
  document.getElementById("leave-team-button").addEventListener("click", leaveTeamHandler);
  document.getElementById("new-team").addEventListener("click", createTeamHandler);
  document.getElementById("join-team").addEventListener("click", joinTeamHandler);
  document.getElementsByClassName('login-email')[0].addEventListener('click', handleLoginEmail);
  document.getElementsByClassName('login-gmail')[0].addEventListener('click', handleLoginGmail);
}

//chrome.browserAction.onClicked.addListener(updateSites(getDomains()));

window.onload = function () {
  updateProductivity();
  updateCurrentDomain();
};

getContext();

document.addEventListener('DOMContentLoaded', function () {
  initializeListeners();
});
