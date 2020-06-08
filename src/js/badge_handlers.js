/* eslint-disable no-unused-vars */

/*
 * Checks if user is new and calls setBadges to give user
 * the New Member badge
 *
 * parameters: none
 *
 */
const triggerNewMember = () => {
  if (!userContext || !userContext.badges){
    return;
  }
  if (!userContext.badges[NEW_MEMBER_BADGE_IDX]){
    setBadges(NEW_MEMBER_BADGE_IDX, true);
  }
  return;
};

/*
 * Updates the productivity value badges for a user
 *
 * parameters: none
 *
 */
const triggerNumProductivity = () => {
  if (!userContext || !userContext.badges || !userContext.productivity){
    return;
  }
  const productivityNumbers = [70, 75, 80, 85, 90, 95];
  const badgeIndexes = [7, 8, 9, 10, 11, 12];
  for ( let i = 0; i < badgeIndexes.length; i++ ) {
    if ( userContext.productivity > productivityNumbers[i] ) {
      setBadges(badgeIndexes[i], true);
    } else {
      setBadges(badgeIndexes[i], false);
    }
  }
  // badge just for less than 70 productivity
  if ( userContext.productivity < 70 ) {
    setBadges(BELOW_70_BADGE_IDX, true);
  }
};

/*
 * Updates the least time wasted badge for the user
 * User gets/retains the badge if the user has the least time wasted
 * in the entire team; otherwise, it does not attain/loses the badge
 *
 * parameters: none
 *
 */
const triggerLeastTimeWasted = () => {
  if (!userContext || !userContext.badges || !teamContext ||!teamContext.membersData) {
    return;
  }
  let leastWasted = true;
  teamContext.membersData.forEach(function (member) {
    if(member.timeWasted < userContext.timeWasted) {
      setBadges(LEAST_WASTED_TIME_BADGE_IDX, false);
      leastWasted = false;
    }
  });
  if(leastWasted) {
    setBadges(LEAST_WASTED_TIME_BADGE_IDX, true);
  }
};

const triggerMostProductive = () => {
  if (!userContext || !userContext.badges || !teamContext ||!teamContext.membersData) {
    return;
  }
  let mostProductive = true;
  teamContext.membersData.forEach(function (member) {

    // p%/100 * TT = PT => (1-p%/100) * TT = TW
    // p% = PT/TT *100 => p%/100*TT = PT
    // TW = TT - PT => PT = TT- TW
    // p%/100 * TT = TT - TW
    // (1-p%/100) * TT = TW
    // TT = TW/(1-(p%/100))
    // userTimeWasted = 5
    // userProd = 90 test case
    let userTotalTime = userContext.timeWasted / (1 - (userContext.productivity / 100));
    let userProdTime = userTotalTime - userContext.timeWasted;
    let memberTotalTime = member.timeWasted / (1 - (member.productivity / 100));
    let memberProdTime = memberTotalTime - member.timeWasted;
    if( memberProdTime > userProdTime) {
      setBadges(MOST_PRODUCTIVE_BADGE_IDX, false);
      mostProductive = false;
    }
  });
  if(mostProductive) {
    setBadges(MOST_PRODUCTIVE_BADGE_IDX, true);
  }
};
/* eslint-enable no-unused-vars */
