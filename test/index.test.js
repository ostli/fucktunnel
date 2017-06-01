const FuckTunnel = require('../src');

let config = {
  proxy: {// 和SSH2的参数保持一致
    host: '10.160.57.59',
    port: '8222',
    username: 'root',
    password: 'kingsoft',
    reconnect: true,
    reconnectDelay: 10000,
    reconnectTries: 10
  },
  tunnels: {
    api: '54321:10.168.89.30:8080',
    neutron: '9696:10.168.89.30:9696',
    identity: '5000:10.168.89.30:5000',
    keystone: '35357:10.168.89.30:35357',
    nova: '8774:10.168.89.30:8774',
    oam: '8089:10.168.89.30:8089'
  }

};
let fuckTunnel = new FuckTunnel(config);
fuckTunnel.connect().then(result => console.log('success'));
// tunnel.disconnect().then(result => console.log(result));
// tunnel.reconnect().then(result => console.log(result));
