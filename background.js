var curPage = {};

const formatDuration = (d) => {
  if (d < 0) {
    return "?";
  }
  var divisor = d < 3600000 ? [60000, 1000] : [3600000, 60000];
  function pad(x) {
    return x < 10 ? "0" + x : x;
  }
  return Math.floor(d / divisor[0]) + ":" + pad(Math.floor((d % divisor[0]) / divisor[1]));
}

const tick = () => {
  if (curPage.begin === undefined)
    return;

  const timeSinceBegin = formatDuration(new Date() - curPage.begin);
  chrome.browserAction.setBadgeText({ 'tabId': parseInt(curPage.tabId), 'text': timeSinceBegin});
};

const handleUpdate = (tabId, changeInfo, tab) => {
  const domain = changeInfo.url;
  if (curPage.domain === domain)
    return;

  curPage.domain = domain;
  curPage.begin = new Date();
  curPage.tabId = tabId;
};

setInterval(tick, 1000);

chrome.tabs.onUpdated.addListener(handleUpdate);
