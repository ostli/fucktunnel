/**
 * 处理异常
 **/
const C = require('cli-color')

return {
  SSHConnectionError: (err, reject) => {
    if (err.code === 'ENOTFOUND') {
        reject('Could not find host ' + sshConfig.host);
    } else if (err.level === 'connection-timeout') {
        reject('Connection timed out for host ' + sshConfig.host);
    } else {
        reject("Error on SSH connection '" + err + "'");
    }
  }
  ,TunnelServerError: (err, reject) => {
    if (err.code === 'EADDRINUSE') {
        Log('Port ' + C.white(localPort) + ' is in use')
        reject()
    }
  }
}
