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
 * TODO
 * Updates the 'productive' flag for the domain for the user
 *
 * paremeters:
 *      domain (string) - domain for which we're changing (e.g. 'reddit.com')
 *      val (boolean) - true for 'productive' and false for 'unproductive'
 *
 * return
 *      0 upon success, 1 otherwise
 */
const updateDomainProductive = () => {
  return 0;
}
