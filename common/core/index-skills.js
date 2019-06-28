module.exports = async ( fs, idList, debug ) => {
    try {

        //Update skills-indexing
        if( debug ) console.log("Updating skill indexes")

        try { delete require.cache[require.resolve("./../data/skillList.json")] }
        catch(e) {}

        try { delete require.cache[require.resolve("./../data/abilityList.json")] }
        catch(e) {}

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

        skills = skills.filter(s => idList.find(idl => idl.skill === s.id)).map(s => {
            let ab = abilities.find(a => a.id === s.abilityReference)
            for( let i = 0; i < s.tierList.length; ++i) {
                ab.tierList[i].powerOverrideTag = s.tierList[i].powerOverrideTag
            }
            let unitId = (idList.find(idl => idl.skill === s.id) || {}).unitId

            return JSON.parse(JSON.stringify({
                id:s.id,
                unitId:unitId,
                abilityId:s.abilityReference,
                nameKey:ab.nameKey,
                isZeta:s.isZeta,
                tiers:ab.tierList,
                type:ab.abilityType
            }))
        })

        abilities = null

        const user = process.env.USER || null
        const pass = process.env.PASS || null
        const langPort = process.env.LANG_PORT || 3203

        // skip localization if not using the premium client
        if (!(user && pass)) {
            skills = await require('node-fetch')(`http://localhost:${langPort}/lang/eng_us`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( skills )
            }).then(res => res.json())
        }

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
