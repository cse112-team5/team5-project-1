/*
 * Globals
 */

var userLoggedIn = false;
var userEmail = undefined;
var userUid = undefined;
/*
 * Firebase initializations
 */


const portAuth = chrome.extension.connect({ name: 'auth' });
portAuth.onMessage.addListener((msg) => {
  console.log("RECEVE", msg);
  if (msg.res === 'logged-in') {
    userLoggedIn = true;
    userEmail = msg.email;
    userUid = msg.uid;
    renderHome();
  }
  else if (msg.res === 'auth-context') {
    userLoggedIn = msg.loggedIn;
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

const portUserData = chrome.extension.connect({ name: 'user-data' });
portUserData.onMessage.addListener((msg) => {
  console.log("RECEVE", msg);
  if (msg.res === 'invite-code-false') {
    addTeamFormation();
  }
  else if (msg.res === 'invite-code-true') {
    console.log("has invite code");
    showInviteCode(msg.invite_code);
  }
  else {
    console.log("rip");
  }
});
const handleInviteCode = () => {
  console.log("Getting Invite Code");
  portUserData.postMessage({ task: 'get-invite-code' });
};

//ui.start('#firebaseui-auth-container', uiConfig);

/*
 * Client side functions
 */


function compareTime(a, b) {
  return b[1].time - a[1].time;
}

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

function createTeam(teamName) {
  const db = firebase.firestore();

  if (userUid !== undefined){
    db.collection("teams").add({
      name: teamName,
      members: []
    })
      .then(function (docRef) {
        console.log("Document written with ID: ", docRef.id);
        db.collection("teams").doc(docRef.id).update({
          invite_code: docRef.id
        })
          .then(function () {
            console.log("Document successfully updated!");
            joinTeam(docRef.id);
            return docRef.id;
          })
          .catch(function (error) {
            // The document probably doesn't exist.
            console.error("Error updating document: ", error);
          });
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
      });
  }
}

function joinTeam(invite_code) {
  const db = firebase.firestore();

  if (userUid !== undefined) {
    db.collection("teams").where("invite_code", "==", invite_code).get().then((qs) => {
      if (qs.size === 1){
        let teamDoc = null;
        qs.forEach((doc) => {
          teamDoc = doc;
        });
        return teamDoc;
      } else {
        throw new Error("Error with invite code");
      }
    }).then((teamDoc) => {
      if (teamDoc == null) {
        throw new Error("Error with invite code");
      }
      let members = teamDoc.data().members;
      members.push(userUid);
      db.collection("teams").doc(teamDoc.id).update({members: members});
      db.collection("users").doc(userUid).update({teamId: teamDoc.id});

      showInviteCode(invite_code);
      removeTeamFormation();
    }).catch((err)=>{
      console.error("Error in joinTeam: ", err);
    });
  }
}

function leaveTeam(){
  const db = firebase.firestore();

  if (userUid !== undefined){
    db.collection("users").doc(userUid).get()
      .then((userRef)=>{
        let data = userRef.data();
        let teamId = data.teamId;
        data.teamId = null;
        db.collection("users").doc(userUid).set(data);
        return teamId;
      })
      .then((teamId)=>{
        return db.collection("teams").doc(teamId).get();
      })
      .then((teamRef)=>{
        let data = teamRef.data();
        let userIndex = data.members.indexOf(userUid);
        data.members.splice(userIndex, 1);
        db.collection("teams").doc(teamRef.id).set(data);
      })
      .then(()=>{
        let disp = document.getElementById('invite_code_displayed');
        disp.innerHTML = "";
        disp.nextElementSibling.removeEventListener("click", leaveTeamHandler);
        disp.parentNode.removeChild(disp.nextElementSibling);
        addTeamFormation();
      })
      .catch((err)=>{
        console.error("Error leaving team: ", err);
      });
  }
}

function joinTeamHandler() {
  const invite_code = document.getElementById("invite_code").value;
  if (invite_code.length !== 20) {
    return;
  }
  joinTeam(invite_code);
}

function createTeamHandler() {
  teamName = document.getElementById('new_team_name').value;
  createTeam(teamName);
}

function leaveTeamHandler(){
  leaveTeam();
}

function showInviteCode(invite_code){
  document.getElementById('invite_code_displayed').innerHTML = "Team invite code: " + invite_code;
  let leaveTeamButton = document.createElement("button");
  leaveTeamButton.id = "leaveTeamButton";
  leaveTeamButton.innerHTML = "Leave Team";
  leaveTeamButton.addEventListener("click", leaveTeamHandler);
  document.getElementById('invite_code_displayed').parentNode.appendChild(leaveTeamButton);
}

function removeTeamFormation() {
  // remove event listeners
  let createTeamButton = document.getElementById("newTeam");
  createTeamButton.removeEventListener("click", createTeamHandler);
  let joinTeamButton = document.getElementById("joinTeam");
  joinTeamButton.removeEventListener("click", joinTeamHandler);

  // remove elements
  let elem = document.getElementById("team-formation");
  elem.innerHTML = '';
}

function addTeamFormation(){
  let elem = document.getElementById("team-formation");
  elem.innerHTML =  `
  <div>
    <form id=selection>
      <label for=new_team_name>Team name:</label><br>
      <input type=text id=new_team_name name=new_team_name><br>
    </form>
    <button id=newTeam>Create team</button>
  </div>
  <div>
    <form id=joinTeamForm>
      <label for=invite_code>Invite Code:</label><br>
      <input type=text id=invite_code name=invite_code><br>
    </form>
    <button id=joinTeam>Join team</button>
  </div>
  `;

  document.getElementById("newTeam").addEventListener("click", createTeamHandler);
  document.getElementById("joinTeam").addEventListener("click", joinTeamHandler);

}
/*
 * HTML rendering
 */

// grabs the auth context from background.js
const getAuthContext = () => {
  portAuth.postMessage({ task: 'get-auth-context' });
};

const renderHome = () => {
  if (userLoggedIn) {
    // we're logged in
    const home = document.getElementsByClassName('home')[0];
    while (home.firstChild) home.removeChild(home.firstChild);

    home.innerHTML = `
    <p class="result-email"></p>
    <p class="result-uid"></p>
    `;

    document.getElementsByClassName('result-email')[0].innerHTML = userEmail;
    document.getElementsByClassName('result-uid')[0].innerHTML = userUid;

    handleInviteCode();
  }
  else {
    // we're not logged in, so display the login options
    const home = document.getElementsByClassName('home')[0];
    while (home.firstChild) home.removeChild(home.firstChild);

    home.innerHTML = `
    <div class="login-options">
      <button class="login-email">Login with Email</button>
      <button class="login-gmail">Login with Gmail</button>
    </div>
    `;

    document.getElementsByClassName('login-email')[0].addEventListener('click', handleLoginEmail);
    document.getElementsByClassName('login-gmail')[0].addEventListener('click', handleLoginGmail);
  }
};

chrome.browserAction.onClicked.addListener(updateSites(getDomains()));

window.onload = function () {
  updateProductivity();
  updateCurrentDomain();
};

getAuthContext();

document.addEventListener('DOMContentLoaded', function () {
  renderHome();
});
