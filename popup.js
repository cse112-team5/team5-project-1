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

const getDomains = () => {
  const db = firebase.firestore();
  const user = db.collection('users').doc('user_0');

  user.get()
    .then(doc => {
      const data = doc.data();
      console.log(data);
      document.getElementById('sample-text').innerHTML = JSON.stringify(data);
    })
}

window.onload = function() {
  getDomains();
};
