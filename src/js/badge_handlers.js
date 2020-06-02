/*
 * Checks if user is new and calls setBadges to give user
 * the New Member badge
 *
 * parameters: none
 *
 */
/* eslint-disable no-unused-vars */
const triggerNewMember = () => {
  if (!userContext || !userContext.badges){
    return;
  }
  if (!userContext.badges[0]){
    setBadges(0, true);
  }
  return;
};
/* eslint-enable no-unused-vars */
