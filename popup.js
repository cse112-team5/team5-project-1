var config = {
  apiKey: "TODO",
  authDomain: "TODO",
  databaseURL: "TODO",
  projectId: "TODO",
  storageBucket: "TODO",
  messagingSenderId: "TODO",
  appId: "TODO"
};

firebase.initializeApp(config);

function compareTime(a, b) {
  return b[1].time - a[1].time;
}

async function getDomains() {
  const db = firebase.firestore();
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
  })
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

    var MAX_SITES = 5
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

chrome.browserAction.onClicked.addListener(updateSites(getDomains()));
window.onload = function() {
  getDomains();
  port.postMessage("load domain");
  updateProductivity();
};
