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

const updateProductivity = () => {
  //TODO calculate productivity with an API instead of dummy values
  p_score = 100;
  document.getElementById('p_score').innerHTML = p_score + "%";
}
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
    let matches = msg.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    let domain = matches && matches[1];
    this.document.getElementById('domain').innerHTML = domain;
  }
}); 


window.onload = function() {
  getDomains();
  port.postMessage("load domain");
  updateProductivity();
};
