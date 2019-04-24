var fetch = require('node-fetch')
var cliport = process.env.CLIPORT || 3110

module.exports = async ( allycode, res ) => {

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Transfer-Encoding', 'chunked')
    
    var player = await fetch('http://localhost:'+cliport+"/pipe/player/"+allycode+"?noConvert").then(r => r.json())
    var { guild }  = await fetch('http://localhost:'+cliport+"/pipe/guild/"+player.guildId+"?noConvert").then(r => r.json())
    
    res.write("[")
    //console.log("[")
    
    var first = true
    for( var gm of guild.memberList ) {

        var member = await fetch('http://localhost:'+cliport+"/pipe/player/"+gm.playerId).then(r => r.json())
        res.write((!first ? "," : "")+JSON.stringify(member))
        //console.log((!first ? "," : "")+JSON.stringify(member))
        first = false

        //await new Promise(end => { setTimeout(end, 350) })
    }    

    res.write("]")
    //console.log("]")

    return
        
}
