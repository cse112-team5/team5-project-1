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

var portAuth = null;
var portUserData = null;
var portUserDataOptions = null;

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
      if (msg.task === 'get-context'){
        sendContext();
      }
    });
  } else if(port.name === 'user-data-options'){
    portUserDataOptions = port;
    portUserDataOptions.onMessage.addListener(function(msg) {
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


/*
 * portAuth handlers
 */

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


/*
 * portUserData handlers
 */

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
 * portUserDataOptions handlers
 */
function getUserId() {
  const user = firebase.auth().currentUser;
  if(user) {
    portUserDataOptions.postMessage({
      res: 'logged_in',
      user_uid: user.uid
    });
  }
}

/*
 * portTeamData handlers
 */

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