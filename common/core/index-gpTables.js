module.exports = async ( fs, debug ) => {
    try {
        
        //Update skills-indexing
        if( debug ) console.log("Updating GP table indexes")

        try { delete require.cache[require.resolve("./../data/tableList.json")] }
        catch(e) {}
        
        try { delete require.cache[require.resolve("./../data/xpTableList.json")] }
        catch(e) {}
        
        let tables = {}
        
        let tableList = []
        if( debug ) console.log("Requiring /data/tableList.json")
        try { tableList = require('./../data/tableList.json') } 
        catch(e) {
            if( debug ) console.error("! Could not find /data/tableList.json")
        }
        
        let xpTableList = []
        if( debug ) console.log("Requiring /data/xpTableList.json")
        try { xpTableList = require('./../data/xpTableList.json') }
        catch(e) {
            if( debug ) console.error("! Could not find /data/xpTableList.json")
        }

        let overrides =  tableList.find(tl => tl.id === 'galactic_power_per_tagged_ability_level_table').rowList
        
        //MOD TABLES
        tables.modTable = tableList.find(tl => tl.id === 'crew_rating_per_mod_rarity_level_tier').rowList.map(tl => {
            return {
                key:tl.key,
                value:Number(tl.value)
            }
        })
        //SHIP MOD TABLES
        let stars = ["ZERO","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN"]
        tables.crewModTable = [[0,0,0,0,0,0,0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]]
        for( let s = 1; s < stars.length; ++s ) {
            let cr = (xpTableList.find(tl => tl.id === 'crew_rating_per_mod_level_'+stars[s].toLowerCase()+'_star') || {}).rowList || []
            //console.log( stars[s].toLowerCase(), cr.length )
            for( let l = 1; l < 16; ++l ) {
                tables.crewModTable[l].push( (cr[l-1] || {}).xp || 0 )
            }
        }
                
        //ABILITY TABLES
        tables.abilityTable = xpTableList.find(tl => tl.id === 'galactic_power_per_ship_ability_level_table').rowList.reduce((acc,i) => {
            acc.push(Number(i.xp))
            return acc
        },[0])
        tables.abilityTable.push( overrides.find(o => o.key === 'zeta').value )
        //GEAR TABLES
        tables.gearTable = tableList.find(tl => tl.id === 'crew_rating_per_gear_piece_at_tier').rowList.reduce((acc,i) => {
            acc.push(Number(i.value))
            return acc
        },[0])
        //RARITY TABLES
        tables.rarityTable = tableList.find(tl => tl.id === 'crew_rating_per_unit_rarity').rowList.reduce((acc,i) => {
            acc.push(Number(i.value))
            return acc
        },[0])
        //LEVEL TABLES
        tables.levelTable = xpTableList.find(tl => tl.id === 'crew_rating_per_unit_level').rowList.reduce((acc,i) => {
            acc.push(Number(i.xp))
            return acc
        },[0])
        //MULTIPLIER TABLES
        tables.multiplierTable = tableList.find(tl => tl.id === 'crew_contribution_multiplier_per_rarity').rowList.reduce((acc,i) => {
            acc.push(Number(i.value))
            return acc
        },[0])
        //CREW SIZE TABLES
        tables.crewSizeTable = tableList.find(tl => tl.id === 'galactic_power_modifier_per_ship_crew_size_table').rowList.reduce((acc,i) => {
            acc.push(Number(i.value))
            return acc
        },[0])
        //CONTRACT TABLES
        tables.contractTable = [0].concat( overrides.filter(o => o.key.includes('contract')).map(o => Number(o.value)) )
        //REINFORCEMENT TABLES
        tables.reinforcementTable = [0].concat( overrides.filter(o => o.key.includes('reinforcement')).map(o => Number(o.value)) )
        

        try { 
            if( debug ) console.log("Saving /data/index_gpTables.json")
            await fs.writeFileSync("./data/index_gpTables.json", JSON.stringify({tables:tables},0,2), 'utf8') 
            if( debug ) console.log("+ GP table index up to date")
        } catch(e) {
            if( debug ) console.error("! Could not save /data/index_gpTables.json")
        }

        return 

    } catch(e) {
        console.error('! Error indexing GP tables')
        console.error(e)
    }
}
