var fetch = require('node-fetch')
var cliport = process.env.CLIPORT || 3110

module.exports = async ( allycode, res ) => {

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Transfer-Encoding', 'chunked')
    
    var player = await fetch('http://localhost:'+cliport+"/pipe/player/"+allycode+"?noConvert").then(r => r.json())
    var { guild }  = await fetch('http://localhost:'+cliport+"/pipe/guild/"+player.guildId+"?noConvert").then(r => r.json())

    guild = {
        name: guild.profile.name,
        desc: guild.profile.externalMessageKey,
        members: guild.profile.memberCount,
        status: guild.profile.enrollmentStatus,
        required: guild.profile.levelRequirement,
        bannerColor: guild.profile.bannerColorId,
        bannerLogo: guild.profile.bannerLogoId,
        message: guild.profile.internalMessage,
        gp: guild.profile.guildGalacticPower,
        raid: guild.profile.raidLaunchConfigList.reduce((acc, r) => {
            acc[r.raidId] = r.campaignMissionIdentifier.campaignMissionId;
            return acc;
        }, {}),
        roster: guild.memberList.map(m => { 
            return {
                playerId: m.playerId,
                guildMemberLevel: m.guildMemberLevel,
                name: m.playerName,
                level: m.playerLevel,
                allyCode: m.allyCode,
                gp: m.galacticPower
            }
        })
    }
    
    var retval = Object.assign({},guild)
    
    delete retval.roster
    retval = JSON.stringify(retval)
    retval = retval.slice(0, retval.length-1)

    res.write(retval)
    //console.log(retval)
    res.write(",\"roster\":[")    
    //console.log(",\"roster\":[")
    
    var first = true
    for( var gm of guild.roster ) {

        var pobj = await fetch('http://localhost:'+cliport+"/pipe/player/"+gm.playerId).then(r => r.json())
        gm.name = pobj.name
        gm.level = pobj.level
        gm.allyCode = pobj.allyCode
        gm.gp = pobj.stats.find(s => s.index === 1).value
        delete gm.playerId

        res.write((!first ? "," : "")+JSON.stringify(gm))
        //console.log((!first ? "," : "")+JSON.stringify(gm))
        first = false

        //await new Promise(end => { setTimeout(end, 350) })
    }    

    res.write("]}")
    //console.log("]}")

    return
        
}
