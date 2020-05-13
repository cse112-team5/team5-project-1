/*
 * Firebase communcation API
 */


/*
 * NOTE: Since we haven't implemented authentication yet, the following API calls should assume a global
 * user, 'user_0'. Once we've implemented user auth, the API calls below can grab the user id from the
 * Firebase auth object. So, there's no need to pass in user id as a parameter as long as the user is
 * logged in.
 */

/*
 * Updates the 'productive' flag for the domain for the user
 *
 * paremeters:
 *      domain (string) - domain for which we're changing (e.g. 'reddit.com')
 *      val (boolean) - true for 'productive' and false for 'unproductive'
 *
 * return
 *      0 upon success, 1 otherwise
 */
const updateDomainProductive = (domain, val) => {
  if (domain.length == 0) return -1;

  const db = firebase.firestore();

  var vis = -1;
  var tim = 0;
  var prod = false;
  db.collection('users').doc('user_0').get().then((snapshot) => {
    var domains = snapshot.data()["domains"];

    if (domain in domains) {
      vis = domains[domain]["visits"];
      tim = domains[domain]["time"];
      prod = domains[domain]["productive"];
    }
    else {
      vis = 1;
      tim = 0;
      prod = true;
    }

    var sitesList = snapshot.data();

    var userRef = db.collection("users").doc("user_0");
    console.log("making productivity = " + val + " for " + domain);
    sitesList["domains"][domain] = { time: tim, productive: val, visits: vis };
    userRef.set(sitesList);
    return 0;
  })
}
