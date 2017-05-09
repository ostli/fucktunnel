const SSHConnect = require('./ssh')
const C = require('cli-color')
const fuckport = require('fuckport')
const utils = require('./utils')

module.exports = FuckTunnel
function FuckTunnel(config) {
  let sshConnect = new SSHConnect()
  let self = this

  //获取host信息
  self.sshConfig = config.connection
  self.tunnelsToCreate = utils.parseTunnelData[config.tunnels]

  utils.log(config.tunnels)


  self.connect = () => {
      return sshConnect
      .connect(self.sshConfig)
      .then(() => {
        let tunnels = []
        self.tunnelsToCreate.forEach(function(entry) {
          let addTunnel = sshConnect.addTunnel(entry)
                                    .catch((err) => utils.log(C.red(err)))
          tunnels.push(addTunnel)
        });

        return Promise.all(tunnels).catch(function(err) {
            console.error(err);
        }).then((result) => {
          return Promise.resolve(result)
        })
      })
      .catch(() => {

      })
    }

}
