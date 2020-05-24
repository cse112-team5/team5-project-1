/*
 * Utility functions
 *
 * Functions that serve modular, project independant purposes should go here
 */
/* eslint-disable no-unused-vars */
function generateId(len) {
  var alphanum = 'ABCDEFGHIJKLMNOPQRSTUV0123456789'.split(''),
    n = alphanum.length;

  for(var i = n - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = alphanum[i];
    alphanum[i] = alphanum[j];
    alphanum[j] = tmp;
  }

  var code = [];
  for (let i = 0; i < len; i++)
    code.push(alphanum[Math.floor(Math.random() * n)]);
  return code.join('');
}

// TODO
// these two functions below shouldnt be here ...
// they're too project dependant, but whatever
// find a better home for them when you've got the time
function sortDomains(data) {
  tempMap = new Map(Object.entries(data));
  return [...tempMap.entries()].sort(compareTime);
}

function compareTime(a, b) {
  return b[1].time - a[1].time;
}
/* eslint-enable no-unused-vars */
