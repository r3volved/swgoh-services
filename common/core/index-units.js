module.exports = async ( fs, debug ) => {
    try {

        //Update units-indexing
        if( debug ) console.log("Updating unit indexes")

        let units = []
        if( debug ) console.log("Requiring /data/unitsList.json")

        try { delete require.cache[require.resolve("./../data/unitsList.json")] }
        catch(e) {}

        try { units = require('./../data/unitsList.json') }
        catch(e) {
            if( debug ) console.error("! Could not find /data/unitsList.json")
        }

        units = units.filter(u => {
            if( u.rarity !== 7 ) return false
            if( u.obtainable !== true ) return false
            if( u.obtainableTime !== 0 ) return false
            return true
        })

        let idList = units.reduce((ids,u) => {
            ids = ids.concat(u.skillReferenceList.map(s => {
                return { unitId:u.baseId, skill:s.skillId }
            }))
            ids = ids.concat(u.crewList.map(cu => {
                return { unitId:cu.unitId, skill:cu.skillReferenceList[0].skillId }
            }))
            return ids
        },[])

        units = units.map(u => {
            return {
                baseId:u.baseId,
                nameKey:u.nameKey,
                combatType:u.combatType,
                categoryIdList:u.categoryIdList,
                crewList:u.crewList,
                statProgressionId:u.statProgressionId,
                crewContributionTableId:u.crewContributionTableId,
                primaryUnitStat:u.primaryUnitStat
            }
        })

        const user = process.env.USER || null
        const pass = process.env.PASS || null
        const langPort = process.env.LANG_PORT || 3203

        // skip localization if not using the premium client
        if (!(user && pass)) {
            units = await require('node-fetch')(`"http://localhost:${langPort}/lang/eng_us`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( units )
            }).then(res => res.json())
        }

        try {
            if( debug ) console.log("Saving /data/index_units.json")
            await fs.writeFileSync("./data/index_units.json", JSON.stringify(units,0,2), 'utf8')
            if( debug ) console.log("+ Unit index up to date")
        } catch(e) {
            if( debug ) console.error("! Could not save /data/index_units.json")
        }

        return idList

    } catch(e) {
        console.error('! Error indexing units')
        console.error(e)
    }
}
