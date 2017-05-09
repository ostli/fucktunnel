/**
 * 多端口转发
 **/
const SSH2 = require('ssh2')
const C = require('cli-color')
const _catch = require('./catch')
const utils = require('./utils')
const _ = require('lodash')
const read = require('read')

let defaultConfig = {
  reconnect: false
  ,defaultPort: 22
}

module.exports = SSHConnect

function SSHConnect() {
  let self = this
  let sshReady = false
  let activeTunnels = {}

  if(new.target !== SSHConnect){
    return new SSHConnect();
  }

  //SSH代理机
  self.connect = (sshConfig) => {
    return new Promise((resolve, reject) => {
      self.sshConnection = new SSH2()
      self.sshConnection
      .on('ready', () => {
          sshReady = true
          utils.log('Successfully connected to host ' + sshConfig.host)
          resolve(self)
      })
      .on('error', (err) => _catch.SSHConnectionError(err, reject))
      .on('close', (hadError) => {
        if(!_.isEmpty(activeTunnels)){
          let tunnelDatas = _.cloneDeep(activeTunnels)
          self.closeTunnel().then(() => {
            if (config.reconnect) {
                reconnect(sshConfig, tunnelDatas).then(function () {
                    utils.log('Successfully reconnected to host ' + sshConfig.host);
                }).catch(function() {
                    utils.log('Unable to reconnect to host ' + sshConfig.host + ' after ' + config.reconnectTries + ' tries.');
                });
            }
          })
        }
      })
      .on('keyboard-interactive', (name, instructions, lang, prompts, finish) =>{
        prompts.forEach((prompt) =>{
            read({prompt: prompt.prompt, silent: true}, (err, password) => {
                finish([password])
            })
        })
      })
      .connect(sshConfig)

    })
  }

  //重新连接
  self.reconnect = (sshConfig, tunnelDatas) => {
    return new Promise((resolve, reject) => {
      let doConnect = function (retries) {
          retries = retries || 0;
          return self.connect(sshConfig).then((connection) => {
              let tunnels = []
              Object.keys(tunnelDatas).forEach(function (key) {
                  let tunnel = tunnelData[key]
                  tunnels.push(self.addTunnel(tunnel.name, tunnel.localPort, tunnel.remoteAddr, tunnel.remotePort))
              });

              Promise.all(tunnels).then(() => resolve()).catch(err => eject(err))

          })
          .timeout(config.reconnectDelay)
          .catch((err) => {
              if (retries + 1 < config.reconnectTries) {
                  return doConnect(retries + 1)
              } else {
                  throw new Error("could not reconnect to " + sshConfig.host)
              }
          })
      }

      doConnect(0).catch(() => reject())
    })
  }

  self.close = () => {
    return new Promise((resolve, reject) => {
      if (sshReady) {
          self.closeTunnel().then(function() {
              self.sshConnection.end()
              resolve()
          }.bind(self))
      } else if (self.sshConnection) {
          self.sshConnection.end()
      } else {
          reject('No ssh connection open')
      }
    })
  }

  //添加端口转发
  //name, localPort, remoteAddr, remotePort
  self.addTunnel = (params) => {

    return new Promise((resolve, reject) => {
      const server = net.createServer()
      server
      .on('connection', (socket) => {
          let buffers = [],
              addBuffer = (data) => buffers.push(data)

          socket.on('data', addBuffer)

          self.sshConnection.forwardOut('', 0, params.remoteAddr, params.remotePort, (error, ssh) => {
              if (error) {
                  return reject('connection: ' + error)
              }
              activeTunnels[params.name].active = true

              while (buffers.length) {
                  ssh.write(buffers.shift())
              }
              socket.removeListener('data', addBuffer)

              ssh
              .on('data', (buf) => {
                  try {
                      socket.write(buf)//向客户端回写信息
                  } catch (ex) {
                      reject('connection: Stream aborted and has been reset (most likely stream interupted by client)')
                  }
              })
              .on('end', () => {
                  ssh.removeAllListeners()
                  socket.end()//服务端结束此次会话
                  activeTunnels[params.name].active = false
              })

              socket
              .on('data', (buf) => {//接收来自客户端的信息
                  try {
                      ssh.write(buf);
                  } catch (ex) {
                      reject('connection: Stream aborted and has been reset (most likely stream interupted by server)')
                  }
              })
              .on('end', () => {//客户端断开连接的处理
                  socket.removeAllListeners()
                  ssh.end()
              })

          })
      })
      .on('listening', () => {
          activeTunnels[params.name] = _.assignIn({
            name: params.name,
            active: false,
            server: server,
            tunnelString: params.localPort + ':' + params.remoteAddr + ':' + params.remotePort
          }, params)

          utils.log('Created new tunnel from port ' + C.white(params.localPort) + ' to ' +
                    C.white(params.remoteAddr) + ':' + C.white(params.remotePort))

          resolve(activeTunnels[params.name])
      })
      .on('error', (err) => _catch.TunnelServerError(err, reject))
      .listen(params.localPort)

    })
  }

  //关闭端口转发
  self.closeTunnel = (name) => {
    return new Promise((resolve, reject) =>{
      if (name && activeTunnels[name]) {
          let tunnel = activeTunnels[name];
          tunnel.server.close(function () {
              delete activeTunnels[name];
              utils.log('Closed tunnel to ' + tunnel.remoteAddr + ':' + tunnel.remotePort)
              resolve()
          });
      } else if (!name) {
          let tunnels = []
          activeTunnels.forEach((key) => {
              tunnels.push(self.closeTunnel(key))
          });
          Promise.all(tunnels).then(() => {
              resolve("All tunnels closed")
          });
      } else {
          reject("No tunnel open with name '" + name + "'");
      }
    })
  }

}
