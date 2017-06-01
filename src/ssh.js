/**
 * 多端口转发
 **/
const SSH2 = require('ssh2');
const utils = require('./utils');
const _ = require('lodash');
const Tunnel = require('./tunnel');
const read = require('read');
const C = require('cli-color');

module.exports = SSHConnect;

function SSHConnect (sshConfig) {
  let self = this;
  if (new.target !== SSHConnect) {
    return new SSHConnect();
  }

  // SSH代理机
  self.connect = () => {
    return new Promise((resolve, reject) => {
      self.sshConnection = new SSH2();
      self.sshConnection
      .on('ready', () => {
        self.tunnelHandler = new Tunnel(self, self.sshConnection);
        utils.log('Successfully connected to host ' + sshConfig.host);
        resolve(self);
      })
      .on('error', (err) => {
        if (err.code === 'ENOTFOUND') {
          utils.log('Could not find host ' + sshConfig.host);
        } else if (err.level === 'connection-timeout') {
          utils.log('Connection timed out for host ' + sshConfig.host);
        } else {
          utils.log('Error on SSH connection ' + err);
        }
        reject();
      })
      .on('close', (hadError) => {
        if (self.tunnelHandler && self.tunnelHandler.activeTunnels) {
          let tunnelData = _.cloneDeep(self.tunnelHandler.activeTunnels);
          self.tunnelHandler.closeTunnel().then(function () {
            utils.log('Connection to ' + sshConfig.host + ' closed' + (hadError ? ' abnormally' : '') +
             (sshConfig.reconnect ? ', reconnecting' : ''));
            self.tunnelHandler = null;
            if (sshConfig.reconnect) {
              self.reconnect(sshConfig, tunnelData).then(function () {
                utils.log('Successfully reconnected to host ' + sshConfig.host);
              }).catch(function () {
                utils.fatal('Unable to reconnect to host ' + sshConfig.host + ' after ' + sshConfig.reconnectTries + ' tries.');
              });
            }
          });
        }
      })
      // .on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
      //   prompts.forEach((prompt) => {
      //     read({prompt: prompt.prompt, silent: true}, (err, password) => {
      //       finish([password]);
      //     });
      //   });
      // })
      .connect(sshConfig);
    });
  };

  // 重新连接
  self.reconnect = (sshConfig, tunnelDatas) => {
    return new Promise((resolve, reject) => {
      let doConnect = function (retries) {
        retries = retries || 0;
        return self.connect(sshConfig).then((connection) => {
          let tunnels = [];
          Object.keys(tunnelDatas).forEach(function (key) {
            let tunnel = tunnelDatas[key];
            tunnels.push(self.addTunnel(tunnel.name, tunnel.localPort, tunnel.remoteAddr, tunnel.remotePort));
          });
          Promise.all(tunnels).then(() => resolve()).catch(err => reject(err));
        })
          .timeout(sshConfig.reconnectDelay)
          .catch(() => {
            if (retries + 1 < sshConfig.reconnectTries) {
              return doConnect(retries + 1);
            } else {
              throw new Error('could not reconnect to ' + sshConfig.host);
            }
          });
      };

      doConnect(0).catch((err) => reject(err));
    });
  };

  self.close = () => {
    return new Promise((resolve, reject) => {
      if (sshReady) {
        self.closeTunnel().then(function () {
          self.sshConnection.end();
          resolve();
        });
      } else if (self.sshConnection) {
        self.sshConnection.end();
      } else {
        reject('No ssh connection open');
      }
    });
  };
}
