/**
 * 端口转发
 * Created by uv-w on 2017/4/26.
 */
//const fuckport = require('fuckport')
const FuckTunnel = require('./src')

let fuckTunnel = new FuckTunnel({
  connection: {
    host: '10.160.57.59',
    username: 'root',
    port: '8222',
    password: 'kingsoft'
  },
  tunnels: {
    api: "54321:10.168.89.30:8080",
    neutron: "9696:10.168.89.30:9696",
    identity: "5000:10.168.89.30:5000",
    keystone: "35357:10.168.89.30:35357"
  },
  reconnect: true,
  reconnectDelay: 10000,
  reconnectTries: 10,
  tryKeyboard: true,
  force: true
})
fuckTunnel.connect().then(() => {
  console.log('success do!')
})
