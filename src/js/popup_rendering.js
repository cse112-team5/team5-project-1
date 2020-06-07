/*
 * Util functions
 */
const timeToString = (time) => {
  console.log("[time]: " + time);
  let hours = Math.floor(time / NUM_SECONDS_IN_HOUR);
  let minutes = Math.floor((time % NUM_SECONDS_IN_HOUR) / NUM_SECONDS_IN_MINUTE);
  let seconds = Math.floor(minutes % NUM_SECONDS_IN_MINUTE);
  if (seconds >= SECONDS_ROUNDING) minutes++;
  return hours + " h " + minutes + " m";
};

/* eslint-disable no-unused-vars */
/*
 * Element rendering togglers
 */


const showInviteCode = () => {
  const teamInfo = document.getElementsByClassName("team-info")[0];
  teamInfo.style.display = "block";
  document.getElementById("team-name").innerHTML = "Team name: " + teamContext.name;
  document.getElementById("team-invite-code").innerHTML = "Team invite code: " + teamContext.inviteCode;
};

const showTeamFormation = () => {
  showElement("team-formation");
};

const hideElement = (elementClass) => {
  const element = document.getElementsByClassName(elementClass)[0];
  element.style.display = "none";
};

const showElement = (elementClass) => {
  const element = document.getElementsByClassName(elementClass)[0];
  element.style.display = "block";
};

const showMyStats = () => {
  // make stats visible
  showElement("my-stats");

  // update user's productivity score
  const productivityScoreElement = document.getElementsByClassName("stats-productivity-val")[0];
  productivityScoreElement.innerHTML = "N/A";
  if (userContext.productivity) {
    productivityScoreElement.innerHTML = userContext.productivity.toFixed(1) + "%";
  }

  // update user's time wasted
  const timeWastedElement = document.getElementsByClassName("stats-time-wasted-val")[0];
  timeWastedElement.innerHTML = userContext.timeWasted ? ((userContext.timeWasted >= NUM_SECONDS_IN_HOUR) ? timeToString(userContext.timeWasted) : timeToString(userContext.timeWasted).split("h")[1]) : "0m";

  // update to display the current domain
  if (renderContext.currentDomain) {
    this.document.getElementsByClassName("stats-cur-domain-val")[0].innerHTML = renderContext.currentDomain;
  }

  // update the list of top sites
  if (!userContext.domains) {
    return;
  }

  let numSites = userContext.domains.length < MAX_SITES_LIST_LEN ?
    userContext.domains.length : MAX_SITES_LIST_LEN;

  let list = document.createElement("ol");
  for (let i = 0; i < numSites; i++) {
    let item = document.createElement("li");
    item.appendChild(document.createTextNode(userContext.domains[i][0]));
    list.appendChild(item);
  };

  document.getElementsByClassName("stats-top-sites")[0].innerHTML = "Top " + numSites + " visted sites:";

  // clears pre-existing list
  document.getElementsByClassName("stats-top-sites-val")[0].innerHTML = "";
  document.getElementsByClassName("stats-top-sites-val")[0].appendChild(list);

};

const showRecommendation = () => {
  // find the non-productive domain with the highest time spent
  let maxTime = 0;
  let maxDomain = "N/A";
  for(let i = 0; i < userContext.domains; i++) {
    if (userContext.domains[i][1].productive === true)
      continue;

    let currDomain = userContext.domains[i][0];
    if (userContext.domains[i][1].time > maxTime) {
      maxTime = userContext[i][1].time;
      maxDomain = currDomain;
    }
  }

  if (maxDomain === "N/A") {
    var newRec = "No recommendation yet. Hint: Try labelling some sites as distracting.";
    console.log("No recommendation");
  } else {
    var newRec = "Based on your browsing habits, try to spend less time on " + maxDomain;
    console.log("Recommendation: spend less time on " + maxDomain);
  }

  document.getElementsByClassName("stats-recommendation")[0].innerHTML = newRec;
  document.getElementsByClassName("stats-recommendation")[0].style.display = "block";
};

const hideRecommendation = () => {
  document.getElementsByClassName("stats-recommendation")[0].style.display = "none";
};

const showScreenTabs = () => {
  showElement("screen-tabs");
};

const showLeaderBoard = () => {

  // show and populate leaderboard if user is in a team
  if (teamContext.membersData) {

    // create table element
    let table = document.createElement("table");
    table.style = "text-align: center; max-height: 70%";

    // add caption/title
    let tableTitle = document.createElement("caption");
    tableTitle.innerText = "Team LeaderBoard";
    table.appendChild(tableTitle);

    // add header row to table
    let headerTitles = ["Rank", "Name", "Productivity", "Time Wasted"];
    table = addRowToTable(headerTitles, table, true);

    // generate and add table rows based on user ranking
    let count = 1;
    teamContext.membersData.forEach(function (member) {
      if (!member) {
        return;
      }

      if (member.productivity) {
        let values = [count, member.name, member.productivity.toFixed(2) + "%", timeToString(member.timeWasted)];
        table = addRowToTable(values, table, false);
      }
      count += 1;
    });

    // clear current content within leaderboard element and add generated list of rankings
    document.getElementsByClassName("team-leaderboard")[0].innerHTML = "";
    document.getElementsByClassName("team-leaderboard")[0].style.display = "block";
    document.getElementsByClassName("team-leaderboard")[0].appendChild(table);
  } else {
    document.getElementsByClassName("team-leaderboard")[0].innerHTML = "Error retrieving data for leaderboard";
  }
};

const addRowToTable = (row, table, header) => {
  let item = document.createElement("tr");
  for (let i = 0; i < row.length; i++){
    let elem = document.createElement("td");
    if (!header && i === 0 && row[i] >= 1 && row[i] <= MAX_TOP_LEADERBOARD_PLACE){
      let image = document.createElement("img");
      image.src = "../images/Vector graphics/" + leaderboard_ranking_images[row[i] - 1];
      elem.append(image);
    } else {
      elem.append(document.createTextNode(row[i]));
    }
    item.appendChild(elem);
  };
  table.appendChild(item);
  return table;
};

const showError = () => {
  const bodyElement = document.getElementsByTagName("body")[0];
  bodyElement.innerHTML = "<h1>An error has been encountered. Please reopen the popup.</h1>";
};

const showBadges = () => {
  if (!userContext.badgesArr) {
    return;
  }

  const badgesList = document.getElementsByClassName("my-badges")[0].children[0];
  badgesList.innerHTML = "";
  badgesList.style = "list-style-type: none; overflow-x: scroll;";
  for (let i = 0; i < badges_image_files.length; i++) {
    let badge = document.createElement("li");
    let img = document.createElement("img");
    img.src = "../images/Vector graphics/" + badges_image_files[i];
    img.title = badges_image_files[i];
    img.setAttribute("class", "badges");
    if (!userContext.badgesArr[i]) {
      img.style = "filter: grayscale(100)";
    }
    badge.appendChild(img);
    badgesList.appendChild(badge);
  }
  document.getElementsByClassName("my-badges")[0].style.display = "block";
};

/* eslint-enable no-unused-vars */
