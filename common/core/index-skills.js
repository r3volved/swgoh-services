module.exports = async ( fs, idList, debug ) => {
    try {
        
        //Update skills-indexing
        if( debug ) console.log("Updating skill indexes")

        delete require.cache[require.resolve("./../data/skillList.json")]
        delete require.cache[require.resolve("./../data/abilityList.json")]
        
        let abilities = []
        if( debug ) console.log("Requiring /data/abilityList.json")
        try { abilities = require('./../data/abilityList.json') }
        catch(e) {
            if( debug ) console.error("! Could not find /data/abilityList.json")
        }
        
        let skills = []
        if( debug ) console.log("Requiring /data/skillList.json")
        try { skills = require('./../data/skillList.json') }
        catch(e) {
            if( debug ) console.error("! Could not find /data/skillList.json")
        }

        skills = skills.filter(s => idList.includes(s.id)).map(s => {
            let ab = abilities.find(a => a.id === s.abilityReference)
            for( let i = 0; i < s.tierList.length; ++i) { 
                ab.tierList[i].powerOverrideTag = s.tierList[i].powerOverrideTag 
            }
        
            return {
                id:s.id,
                nameKey:ab.nameKey,
                isZeta:s.isZeta,
                tiers:ab.tierList,
                type:ab.abilityType
            }
        })

        try { 
            if( debug ) console.log("Saving /data/index_skills.json")
            await fs.writeFileSync("./data/index_skills.json", JSON.stringify(skills,0,2), 'utf8') 
            if( debug ) console.log("+ Skill index up to date")
        } catch(e) {
            if( debug ) console.error("! Could not save /data/index_skills.json")
        }

        return 

    } catch(e) {
        console.error('! Error indexing skills')
        console.error(e)
    }
}
