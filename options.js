var config = {
  apiKey: "TODO",
  authDomain: "TODO",
  databaseURL: "TODO",
  projectId: "TODO",
  storageBucket: "TODO",
  messagingSenderId: "TODO",
  appId: "TODO",
  measurementId: "TODO"
};


firebase.initializeApp(config);

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
    
    var keys = Object.keys(domains);

    keys.forEach(key => {
      if (key === domain) {

        vis = domains[key]["visits"];
        tim = domains[key]["time"]; 
        prod = domains[key]["productive"];
      }
    })
    
    if(vis == -1) return 1; // couldn't find the domain

    sitesList = getDomains();
    
    sitesList.then(sitesList_ => {
      var userRef = db.collection("users").doc("user_0");
      sitesList_["domains"][domain] = { time: tim, productive: val, visits: vis };
      userRef.set(sitesList_);
      return 0;
    })
  })
}
