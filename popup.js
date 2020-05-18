<<<<<<< HEAD
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
=======
var config = {
  apiKey: "AIzaSyCOhTt25qhJtQyWSEUFCU3s_ZE9EC3EiGs",
  authDomain: "cse112-sp20.firebaseapp.com",
  databaseURL: "https://cse112-sp20.firebaseio.com",
  projectId: "cse112-sp20",
  storageBucket: "cse112-sp20.appspot.com",
  messagingSenderId: "861300546651",
  appId: "1:861300546651:web:93eb90114a9f3e6df1737e"
>>>>>>> 869a1c2628ea1909e836c6c7e273eebbe2f0d157
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
//connects popup.js to background.js
var port = chrome.extension.connect({
  name: "Sample Communication"
});

// loads domain from background.js if we get one, otherwise does a backup query
port.onMessage.addListener(function(msg) {
  console.log("message:" +msg);
  // do backup query if msg was null
  if(msg == null){
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
      let url = tabs[0].url;
      // regex to split url from domain
      let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      let domain = matches && matches[1];
      this.document.getElementById('domain').innerHTML = domain;
    });
  }
  else{
    //let matches = msg.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    //let domain = matches && matches[1];
    this.document.getElementById('domain').innerHTML = msg;
  }
});

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
window.onload = function() {
  getDomains();
  port.postMessage("load domain");
  updateProductivity();
};

getAuthContext();

document.addEventListener('DOMContentLoaded', function () {
  renderHome();
});
