/*
 * Firebase communcation API
 */


/*
 * NOTE: Since we haven't implemented authentication yet, the following API calls should assume a global
 * user, 'user_0'. Once we've implemented user auth, the API calls below can grab the user id from the
 * Firebase auth object. So, there's no need to pass in user id as a parameter as long as the user is
 * logged in.
 */
document.addEventListener('DOMContentLoaded', function() {
  var link = document.getElementById('link');
  // onClick's logic below:
  link.addEventListener('click', function() {
    updateDomainProductive('xxx','xxx');
  });
});
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
function updateDomainProductive(domain, val) {
  const db = firebase.firestore();
  // Update for the logged in user
  //

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var ref = db.collection('users').doc(user.uid);

      ref.get().then(function(doc) {
        if (doc.exists) { // user document exists
          console.log("Document data:", doc.data());
        } else { // user document doesn't exist, create it
          console.log("No such document!");
          db.collection('users').doc(user.uid).set({
            domains: {},
            teamId: null
          });
          //return -1;
        }
      }).catch(function(error) { // some error occurred
        console.log("Error getting document:", error);
        return -1;
      });

      const userRef = db.collection("users").doc(user.uid);
      domain = document.getElementById('unproductive_domain').value;
      val = getRadioVal( document.getElementById('selection'), 'if' );
      var isTrue = (val == 'true');
      userRef.get().then(documentSnapshot => {
        if(documentSnapshot.exists) {
          let data = documentSnapshot.data();

          const map = new Map(Object.entries(data["domains"]));

          // update
          if(map.has(domain)) {
            time = data["domains"][domain]["time"];
            visits = data["domains"][domain]["visits"];
            data["domains"][domain] = {productive: isTrue, time: time, visits: visits};
            userRef.set(data);
          }
          // add
          else{
            data["domains"][domain] = {productive: isTrue, time: 0, visits: 0};
            userRef.set(data);
          }
        }
      });
      window.alert("Domain added successfully");
      return 0;

    } else {
      // No user is signed in.
      console.log("no user signed in");
      return 1;
    }
  });
}

//helper function to get user selection
function getRadioVal(form, name) {
  var val;
  // get list of radio buttons with specified name
  var radios = form.elements[name];

  // loop through list of radio buttons
  for(var i=0, len=radios.length; i<len; i++) {
    if(radios[i].checked) { // radio checked?
      val = radios[i].value; // if so, hold its value in val
      break; // and break out of for loop
    }
  }
  return val; // return value of checked radio or undefined if none checked
}
