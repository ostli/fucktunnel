
module.exports = new Utils()

function Utils() { }

Utils.prototype = {
  constructor: Utils
  ,log: (msg, type) => {
    console.log(msg)
  }
  ,parseTunnelData: (tunnelMap) => {
    let tunnelsToCreate = []
    Object.keys(tunnelMap).forEach((name) => {
        let tunnelArr = tunnelMap[name].split(':')
        if (tunnelArr && tunnelArr.length === 3) {
            tunnelsToCreate.push({
                sourcePort: tunnelArr[0],
                host: tunnelArr[1],
                destPort: tunnelArr[2],
                name: name
            })
        }
    });
    return tunnelsToCreate
  }
}
