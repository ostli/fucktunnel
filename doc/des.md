## 需求
1.可以通过调用接口的方式实现端口转发
2.可以通过命令行运行
3.Promise风格
4.依赖ssh2


## api
1.Lib.connect({
    host: '10.160.57.59'
    username: 'root'
    port: '8222'
    password: 'kingsoft'
  })
  .addTunnels({
    'api': "54321:10.168.89.30:8080",
    'api': "54321:10.168.89.30:8080"
  })
  .addTunnels({
    'api': "54321:10.168.89.30:8080",
    'api': "54321:10.168.89.30:8080"
  })
  .removeTunnels({}
    'api': "54321:10.168.89.30:8080",
    'api': "54321:10.168.89.30:8080"
   });

Lib.makeTunnelByConfig({
  file: '/path/config.yml',
  profileName: 'test',
  tunnelGroup: 'test'
})
