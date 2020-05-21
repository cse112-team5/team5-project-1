/*
 * Utility functions
 *
 * Functions that serve modular, project independant purposes should go here
 */

function generateId(len) {
  var alphanum = 'ABCDEFGHIJKLMNOPQRSTUV0123456789'.split(''),
    n = alphanum.length

  for(var i = n - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var tmp = alphanum[i]
    alphanum[i] = alphanum[j]
    alphanum[j] = tmp
  }

  var code = []
  for (let i = 0; i < len; i++)
    code.push(alphanum[Math.floor(Math.random() * n)])
  return code.join('')
}
