/*
 * Globals
 */
/* eslint-disable no-unused-vars */
var userLoggedIn = false;
var userEmail = undefined;
var userUid = undefined;

var teamContext = null;
var userContext = null;

var currentDomain = null;
var currentScreen = SCREEN_MY_STATS;
/* eslint-enable no-unused-vars */
/*
 * Messaging logistics
 */

// port for authentication related communication
const portAuth = chrome.extension.connect({ name: 'auth' });
portAuth.onMessage.addListener((msg) => {
  // nothing here for now
});


const handleLoginEmail = () => {};

const handleLoginGmail = () => {
  console.log("GMAIL");
  portAuth.postMessage({ task: 'login-gmail' });
};

// port for user data related communication
const portUserData = chrome.extension.connect({ name: 'user-data' });
portUserData.onMessage.addListener((msg) => {
  if (msg.res === 'send-context') {
    userContext = {
      loggedIn: msg.loggedIn,
      id: msg.uid,
      email: msg.email,
      productivity: msg.userProductivity,
      domains: msg.userDomains,
    };
    teamContext = { id: msg.teamId, name: msg.teamName, inviteCode: msg.teamInviteCode, membersData: msg.membersData };
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
  // nothing for now
});


/*
 * Client UI handlers
 */


function updateCurrentDomain(){
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    let url = tabs[0].url;
    // regex to split url from domain
    let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    let domain = matches && matches[1];
    currentDomain = domain;
  });
}

function joinTeamHandler() {
  if (teamContext.id){
    showError();
    return;
  }
  const inviteCode = document.getElementById("invite-code").value;
  if (inviteCode.length !== 8) {
    return;
  }
  portTeamData.postMessage({ task: 'join-team', inviteCode: inviteCode });
}

function createTeamHandler() {
  if (teamContext.id){
    showError();
    return;
  }
  const teamName = document.getElementById('new-team-name').value;
  portTeamData.postMessage({ task: 'create-team', teamName: teamName });
}

function leaveTeamHandler(){
  if (!teamContext.id){
    showError();
    return;
  }
  portTeamData.postMessage({ task: 'leave-team' });
}

// TODO figure out a way to consolidate this into one function,
// that way we can switch over the argument rather than having
// seperate functions for each screen
const switchScreenMyTeamHandler = () => {
  currentScreen = SCREEN_MY_TEAM;
  refresh();
};

const switchScreenMyStatsHandler = () => {
  currentScreen = SCREEN_MY_STATS;
  refresh();
};

/*
 * Element rendering togglers
 */


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

function showTeamFormation(){
  const teamFormation = document.getElementById("team-formation");
  teamFormation.style.display = "block";
}

function hideTeamFormation() {
  const teamFormation = document.getElementById("team-formation");
  teamFormation.style.display = "none";
}

const showMyStats = () => {
  const myStatsElement = document.getElementsByClassName('my-stats')[0];
  myStatsElement.style.display = "block";

  // update user's productivity score
  const productivityScoreElement = document.getElementsByClassName('stats-productivity-val')[0];
  if (userContext.productivity)
    productivityScoreElement.innerHTML = userContext.productivity.toFixed(1) + "%";
  else
    productivityScoreElement.innerHTML = "N/A";

  // update to display the current domain
  if (currentDomain) {
    this.document.getElementsByClassName('stats-cur-domain-val')[0].innerHTML = currentDomain;
  }

  // update the list of top sites
  if (userContext.domains) {
    var numSites = userContext.domains.length < MAX_SITES_LIST_LEN ?
      userContext.domains.length : MAX_SITES_LIST_LEN;

    var list = document.createElement('ol');
    for (var i = 0; i < numSites; i++) {
      var item = document.createElement('li');
      item.appendChild(document.createTextNode(userContext.domains[i][0]));
      list.appendChild(item);
    };

    document.getElementsByClassName('stats-top-sites')[0].innerHTML = 'Top ' + numSites + ' visted sites:';

    // clears pre-existing list
    document.getElementsByClassName('stats-top-sites-val')[0].innerHTML = '';
    document.getElementsByClassName('stats-top-sites-val')[0].appendChild(list);
  }
};

const hideMyStats = () => {
  const myStatsElement = document.getElementsByClassName('my-stats')[0];
  myStatsElement.style.display = 'none';
};

const showScreenTabs = () => {
  const screenTabsElement = document.getElementsByClassName('screen-tabs')[0];
  screenTabsElement.style.display = 'block';
};

const hideScreenTabs = () => {
  const screenTabsElement = document.getElementsByClassName('screen-tabs')[0];
  screenTabsElement.style.display = 'none';
};

const showLeaderBoard = () => {

  console.log(teamContext.membersData);

  // show and populate leaderboard if user is in a team
  if (teamContext.membersData){

    // create table element
    let table = document.createElement('table');
    table.style = "text-align: center; max-height: 70%";

    // add caption/title
    let tableTitle = document.createElement("caption");
    tableTitle.innerText = "Team LeaderBoard";
    table.appendChild(tableTitle);

    // add header row to table
    let header = document.createElement('tr');
    let headerTitles = ["Rank", "Name", "Productivity", "Time Wasted"];
    headerTitles.forEach((title)=>{
      let elem = document.createElement('th');
      elem.append(document.createTextNode(title));
      header.appendChild(elem);
    });
    table.append(header);

    // generate and add table rows based on user ranking
    let count = 1;
    teamContext.membersData.forEach(function(member){
      if (member.productivity){
        console.log(count);
        let item = document.createElement('tr');
        let values = [count, member.name, member.productivity + "%",
          Math.floor(member.timeWasted / 3600) + " h " + (Math.floor(member.timeWasted % 60) >= 30 ? Math.floor(member.timeWasted / 60) + 1 : Math.floor(member.timeWasted / 60)) + " m"];

        values.forEach((val)=>{
          let elem = document.createElement('td');
          elem.append(document.createTextNode(val));
          item.appendChild(elem);
        });
        table.appendChild(item);
        count++;
      }
    });

    // clear current content within leaderboard element and add generated list of rankings
    document.getElementsByClassName('team-leaderboard')[0].innerHTML = '';
    document.getElementsByClassName('team-leaderboard')[0].style.display = 'block';
    document.getElementsByClassName('team-leaderboard')[0].appendChild(table);
  } else {
    document.getElementsByClassName('team-leaderboard')[0].innerHTML = 'Error retrieving data for leaderboard';
  }
};

const hideLeaderBoard = () => {
  const leaderBoardElement = document.getElementsByClassName('team-leaderboard')[0];
  leaderBoardElement.style.display = 'none';
};

const showError = ()  => {
  const bodyElement = document.getElementsByTagName('body')[0];
  bodyElement.innerHTML = "<h1>An error has been encountered. Please reopen the popup.</h1>";
};

/*
 * HTML rendering
 */


const refresh = () => {
  const loginOptions = document.getElementsByClassName('login-options')[0];
  const userInfo = document.getElementsByClassName('user-info')[0];

  if (userContext.loggedIn) {
    // display the screen tabs
    showScreenTabs();

    // we're logged in, so display the user info
    loginOptions.style.display = "none";
    userInfo.style.display = "block";
    document.getElementsByClassName('result-email')[0].innerHTML = "Logged in as: " + userContext.email;

    console.log("REFRESH", currentScreen);
    if (currentScreen === SCREEN_MY_STATS) {
      // display the user's stats
      showMyStats();
      hideTeamFormation();
      hideInviteCode();
      hideLeaderBoard();
    }
    else {
      // show our current team if we're part of one, otherwise show the
      // team formation elements
      if (teamContext.id) {
        hideTeamFormation();
        showInviteCode();
        showLeaderBoard();
      }
      else {
        showTeamFormation();
        hideInviteCode();
        hideLeaderBoard();
      }

      hideMyStats();
    }
  }
  else {
    // hide the screen tabs
    hideScreenTabs();

    // we're not logged in, so display the login options
    loginOptions.style.display = "block";
    userInfo.style.display = "none";

    hideTeamFormation();
    hideInviteCode();
    hideLeaderBoard();

    // hide the user's stats
    hideMyStats();
  }
};

const initialize = () => {
  // initialize html element listeners
  document.getElementsByClassName('screen-tabs-my-stats')[0].addEventListener('click', switchScreenMyStatsHandler);
  document.getElementsByClassName('screen-tabs-my-team')[0].addEventListener('click', switchScreenMyTeamHandler);
  document.getElementById("leave-team-button").addEventListener("click", leaveTeamHandler);
  document.getElementById("new-team").addEventListener("click", createTeamHandler);
  document.getElementById("join-team").addEventListener("click", joinTeamHandler);
  document.getElementsByClassName('login-email')[0].addEventListener('click', handleLoginEmail);
  document.getElementsByClassName('login-gmail')[0].addEventListener('click', handleLoginGmail);

  // other initializations
  updateCurrentDomain();
};


window.onload = function () {
  // TODO: do we need this?
  // what's the difference between this and the listener for
  // DOMContentLoaded?
};

// initialize some handlers when the DOM has loaded
document.addEventListener('DOMContentLoaded', function () {
  initialize();
});

// request initial context when the popup is loading
getContext();
