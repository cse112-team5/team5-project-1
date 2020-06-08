/* eslint-disable no-unused-vars */
/*
 * Firebase communcation API
 */

/*
  * Sets the productive field for a list of given domains for a user
  *
  * parameters:
  * List of domains (objects), each containing the following fields
      Url (string)
      Productive (boolean, can be null)
      Time (int, can be null)
      Visits (int, can be null)
  *
  * return
  * 0 on success, null if user not logged in or error occurred
  */
const setDomains = async (domains) => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;
  if (!user) {
    return null;
  }
  try {
    const snapshot = await db.collection("users").doc(user.uid).get()
    var userRef = db.collection("users").doc(user.uid);
    var sitesList = snapshot.data();

    for (let i = 0; i < domains.length; i++) { // iterate through each arg element
      var domList = snapshot.data()["domains"];
      console.log("[NOTE] setDomains: setting on: " + domains[i]);
      var currUrl = domains[i].url;

      if (!domList[currUrl]) {
        console.error("[ERR] setDomains: domain not found in db");
        return;
      }
      var editTime = (domains[i].time == null) ? domList[currUrl].time : domains[i].time;
      var editVisits = (domains[i].visits == null) ? domList[currUrl].visits : domains[i].visits;
      var editProd = (domains[i].productive == null) ? domList[currUrl].productive : domains[i].productive;
      sitesList["domains"][currUrl] = { time: editTime, productive: editProd, visits: editVisits };
    }

    userRef.set(sitesList);
    return sitesList["domains"];
  } catch (error) {
    console.error("[ERR] setDomains:", error);
    return null;
  }
  return 0;
};

/*
 * Create user
 *
 * paremeters:
 *      none
 *
 * return
 *      the user context if successful, null otherwise
 */
/* eslint-disable no-unused-vars */
const createUser = async () => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) {
    // No user is signed in.
    console.error("[ERR] createUser: Not signed in");
    return null;
  }

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (userDoc.exists) {
      // user document exists
      return { id: userDoc.id, teamId: userDoc.data().teamId, domains: sortDomains(userDoc.data().domains), badges: userDoc.data().badges, name: userDoc.data().name };
    } else { // user document doesn't exist, create it
      console.log("[NOTE] createUser: User doesn't exist. Creating doc for user.");
      let badgeArr = new Array(MAX_BADGES).fill(false);
      db.collection("users").doc(user.uid).set({
        domains: {},
        teamId: null,
        name: user.displayName,
        badges: badgeArr
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
    const docRef = await db.collection("users").doc(user.uid).get();
    if (!docRef.exists) { // user document exists
      throw new Error("No such document");
    }

    return docRef.data().domains;
  } catch (error) {
    console.error("[ERR] getDomains:", error);
  }

  return null;
};

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

  var ref = db.collection("users").doc(user.uid);

  ref.get().then(function (doc) {

    if (doc.exists) { // user document exists
      console.log("Document data:", doc.data());
    } else { // user document doesn't exist, create it
      console.log("No doc found! Creating doc for user.");
      db.collection("users").doc(user.uid).set({
        domains: {},
        teamId: null
      });
      //return -1;
    }
  }).catch(function (error) { // some error occurred
    console.log("Error getting document:", error);
    return -1;
  });

  // User is signed in.
  db.collection("users").doc(user.uid).get().then((snapshot) => {
    let domains = snapshot.data()["domains"];
    let FieldPath = firebase.firestore.FieldPath;
    let fp = new FieldPath("domains", domain);

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
    db.collection("users").doc(user.uid).update(fp,{time: tim + increment, productive: prod, visits: vis});
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

  db.collection("users").doc(user.uid).get().then((snapshot) => {
    var domains = snapshot.data()["domains"];
    let FieldPath = firebase.firestore.FieldPath;
    let fp = new FieldPath("domains", domain);

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
    db.collection("users").doc(user.uid).update(fp,{time: tim, productive: prod, visits: vis + 1});
    return 0;
  });
  return 0;
};

/*
 * set's this user's badges on the database with the given array of badges parameter
 *
 * parameters:
 *       badgeNum: index number of badge in the firebase array
 *       badgeOwned: True if user now owns badge, False otherwise
 *
 * return:
 *      null if there is an error; void otherwise
 */
const setBadges = async (badgeNum, badgeOwned) => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) {
    console.error("[ERR] setBadges: Not signed in");
    return null;
  }

  if (!userContext.badges){
    console.error("[ERR] setBadges: badge array not set");
    return null;
  }

  badgesArr = userContext.badges;
  badgesArr[badgeNum] = badgeOwned;
  let res = await db.collection("users").doc(user.uid).update({ badges: badgesArr })
    .then(function () {
      return true;
    })
    .catch(function (error) {
      console.error("Error updating document: badges ", error);
      return false;
    });

  if(res) {
    userContext.badges[badgeNum] = badgeOwned;
    return userContext.badges;
  }
  return null;
};

/*
 * Calculates the productivity score and retrieves domains for user
 *
 * Calls on getUserStatsHelper with the parameter uid as the current user's uid
 * Drops the unnecessary elements and returns the resulting object
 *
 * paremeters:
 *      none
 *
 * return
 *      an object with the following
 *      productivity: 0.0 - 100.0 if valid, null otherwise
 *      domains: the domains object retrieved from firebase
 *      badges: array of booleans representing the badges the user has
 */
const getUserStats = async () => {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!user) {
    // No user is signed in.
    console.error("[ERR] getUserStats: Not signed in");
    return null;
  }

  let userStats = await getUserStatsHelper(user.uid);
  return { productivity: userStats.productivity, domains: userStats.domains, badges: userStats.badges, timeWasted: userStats.timeWasted };
};

/*
 * Calculates the productivity score and retrieves domains for the given user id
 *
 * To calculate the productivity score, first retreive the domain map from
 * Firebase. Then, divide the total time spend on productive sites by the
 * total time spent. If the denominator is 0, return -1. Else return a the
 * score as a percentage float between 0 - 100
 *
 * paremeters:
 *      uid (string) - the uid of the user to retrieve data for
 *
 * return
 *      an object with the following
 *      productivity: 0.0 - 100.0 if valid, null otherwise
 *      domains: the domains object retrieved from firebase
 *      timeWasted: total time spent in the time unit of seconds on unproductive domains
 *      name: name of the user with the specified uid
 *      badges: array of booleans representing the badges the user has
 */
// TODO add name to returned data
const getUserStatsHelper = async (uid) => {
  try {
    const db = firebase.firestore();

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      console.error("[ERR] getUserStats: User document doesn't exist");
      return null;
    }

    const domains = userDoc.data()["domains"];
    const keys = Object.keys(domains);

    var totalTime = 0;
    var prodTime = 0;

    keys.forEach(key => {
      var currTime = domains[key]["time"];
      if (domains[key]["productive"]) {
        prodTime += currTime;
      }
      totalTime += currTime;
    });
    var productivityPercent = null;
    if (totalTime > 0) {
      productivityPercent = (prodTime / totalTime) * 100; // cannot divide by zero, return error
    }
    return { productivity: productivityPercent, domains: domains, timeWasted: (totalTime - prodTime), name: userDoc.data()["name"], badges: userDoc.data()["badges"] };
  } catch (err) {
    console.log("[ERR] getUserstatsHelper: " + err);
  }
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
    return { id: teamDoc.id, ...teamDoc.data() };
  } catch (error) {
    console.error("[ERR] getTeam:", error);
  }
};

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
    const docRef = await db.collection("teams").add({
      name: teamName,
      members: [],
      inviteCode: generateId(8),
    });
    const userDoc = await db.collection("teams").doc(docRef.id).get();

    // return relevant data
    return { id: docRef.id, ...(userDoc.data()) };
  } catch (error) {
    console.error("[ERR] createTeam:", error);
  }

  return null;
};

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

  if (!user) return null;
  try {
    var teamDoc = null;

    if (teamId) {
      teamDoc = await db.collection("teams").doc(teamId).get();
    }
    else {
      const qs = await db.collection("teams").where("inviteCode", "==", inviteCode).get();
      if (qs.size === 1) {
        qs.forEach((doc) => {
          teamDoc = doc;
        });
      }
      else throw new Error("Error with invite code");
    }

    const members = teamDoc.data().members;
    members.push(user.uid);
    db.collection("teams").doc(teamDoc.id).update({ members: members });
    db.collection("users").doc(user.uid).update({ teamId: teamDoc.id });

    // need to add current user to list of members
    let teamDocData = { ...teamDoc.data() };
    teamDocData.members.push(user.uid);

    // return relevant data
    return { id: teamDoc.id, ...teamDocData };

  } catch (error) {
    console.error("[ERR] joinTeam:", error);
  }

  return null;
};

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

  if (!user) return false;
  try {
    // remove teamId on user document
    const userRef = await db.collection("users").doc(user.uid).get();
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
};
/* eslint-enable no-unused-vars */
