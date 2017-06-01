const SSHConnect = require('./ssh');
const C = require('cli-color');
// const fuckport = require('fuckport');
const utils = require('./utils');
module.exports = FuckTunnel;
function FuckTunnel (config) {
  let sshConnect = new SSHConnect(config.proxy);
  let self = this;

  // 获取host信息
  // self.sshConfig = config.connection;
  // self.tunnelsToCreate = utils.parseTunnelData[config.tunnels];

  // utils.log(config.tunnels);
  self.connect = () => {
    return sshConnect
      .connect()
      .then((app) => {
        let tunnels = [];
        for (let key in config.tunnels) {
          let value = config.tunnels[key].split(':');
          let addTunnel = sshConnect.addTunnel({
            remoteAddr: value[2],
            remotePort: value[1],
            localPort: value[0]
          }).catch((err) => utils.log(C.red(err)));
          tunnels.push(addTunnel);
        }

        return Promise.all(tunnels).catch(function (err) {
          console.error('error: ' + err);
        }).then((result) => {
          return Promise.resolve(result);
        });
      })
      .catch((err) => {
        utils.log(err);
      });
  };
}
