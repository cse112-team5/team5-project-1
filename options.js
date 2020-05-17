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
  // TODO (Madhav, Xianhai)
  // Update for the logged in user
  //
  // Instead of 'user_0', use the uid of the currently logged in user.
  // In addition, add a check at the beggining of this function, returning
  // if there is no logged in user
  //
  // NOTE: use firebase.auth().currentUser.uid as the identifier
  const user = db.collection("users").doc("user_0");
  domain = document.getElementById('unproductive_domain').value;
  val = getRadioVal( document.getElementById('selection'), 'if' );
  var isTrue = (val == 'true');
  user.get().then(documentSnapshot => {
    if(documentSnapshot.exists) {
      let data = documentSnapshot.data();

      const map = new Map(Object.entries(data["domains"]));

      // update
      if(map.has(domain)) {
        time = data["domains"][domain]["time"];
        visits = data["domains"][domain]["visits"];
        data["domains"][domain] = {productive: isTrue, time: time, visits: visits};
        user.set(data);
      }
      // add
      else{
        data["domains"][domain] = {productive: isTrue, time: 0, visits: 0};
        user.set(data);
      }
    }
  });
  window.alert("Domain added successfully");
  return 0;
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
