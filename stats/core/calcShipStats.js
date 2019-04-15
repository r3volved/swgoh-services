module.exports = async ( ships ) => {

    delete require.cache[require.resolve("./statEnum.js")]
    delete require.cache[require.resolve("../../common/data/index_gpTables.json")]
    delete require.cache[require.resolve("../../common/data/index_skills.json")]
    delete require.cache[require.resolve("../../common/data/statProgressionList.json")]
    delete require.cache[require.resolve("../../common/data/unitsList.json")]
    
    let { stats, base, pct } = require('./statEnum.js')
    let { tables } = require('../../common/data/index_gpTables.json')
    let STATS = []

    ships.forEach( ship => {
    
        let finalStats = {}

        //CREW RATING
        //console.log("CREW:")
        let CR = ship.crew.reduce((cr, cu) => {
            let u = cu.unit

            let uCR = 0
            uCR += tables.levelTable[u.level]
            uCR += tables.rarityTable[u.rarity]    
            for( let g = 1; g < u.gear; ++g ) {
            	uCR += tables.gearTable[g] * 6
            }
            uCR +=tables.gearTable[u.gear] * u.equipped.length
            u.skills.forEach( s => {
                let iskill = require('../../common/data/index_skills.json').find(isk => isk.id === s.id)
                let otag = iskill.tiers[0].powerOverrideTag || ""
                if( s.id.includes('contract') || otag.includes('contract') ) {
                	uCR +=tables.contractTable[(s.tier || 0)]
                } else if( s.id.includes('hardware') || otag.includes('hardware') ) {
                	uCR +=tables.reinforcementTable[(s.tier || 0)]
                } else {
                	uCR +=s.tier === 8 && s.isZeta 
                	    ? tables.abilityTable[s.tier] 
                	    : tables.abilityTable[(s.tier || 0)]
                }
            })
            u.mods.forEach(m => {
                let key = m.pips+":"+m.level+":"+m.tier+":"+m.set
                uCR +=parseInt(tables.modTable.find(mt => mt.key === key).value)
            })

            return cr + uCR
        },0)
        //console.log("CR: "+CR)


        //SHIP MULTIPLIER
        let SM = tables.multiplierTable[ship.rarity]
        //console.log("SM: "+SM)

        let unit = require('../../common/data/unitsList.json').find(u => u.id.includes(ship.defId) && u.rarity === ship.rarity)
        let sProgression = require('../../common/data/statProgressionList.json').find(s => s.id === unit.statProgressionId)
        let cProgression = require('../../common/data/statProgressionList.json').find(s => s.id === unit.crewContributionTableId)

        for( i = 1; i < stats.length; ++i ) {

            if( stats[i].includes("_") ) continue

            let div = 100000000

            //BASE STAT
            let BS = unit.baseStat.statList.find(s => s.unitStat == i)
                BS = BS ? BS.unscaledDecimalValue / div : 0    
                BS += base[i]
            
            //STAT CONTRIBUTION
            let SC = 0
            let sls = sProgression.stat.statList.find(sd => sd.unitStat == i)
            SC += sls ? sls.unscaledDecimalValue / div : 0
             
            let slc = cProgression.stat.statList.find(sd => sd.unitStat == i)
            SC += slc ? slc.unscaledDecimalValue / div : 0
            
            //STAT MODIFIERS
            if( i >= 2 && i <= 4 ) { BS += Math.floor( SC * ship.level ); SC = 0 }
            else BS = pct[i] ? BS : Math.floor(BS)
            
            finalStats[stats[i]] = { base:Number(BS), contribution:Number(SC), bonus:0, final:0, pct:pct[i] }
        }

        for( i = 1; i < stats.length; ++i ) {
            
            if( stats[i].includes("_") ) continue

            if( i === 1 ) finalStats[stats[i]].base += ( 18.0 * finalStats["Strength"].base )
            if( i === 6 ) finalStats[stats[i]].base += ( 1.4 * finalStats[stats[unit.primaryUnitStat]].base )
            if( i === 7 ) finalStats[stats[i]].base += ( 2.4 * finalStats["Intelligence"].base )
            
            if( i === 8 ) finalStats[stats[i]].base += ( 0.14 * finalStats["Strength"].base )
            if( i === 8 ) finalStats[stats[i]].base += ( 0.07 * finalStats["Agility"].base )
            if( i === 9 ) finalStats[stats[i]].base += ( 0.1 * finalStats["Intelligence"].base )
            
            if( i === 8 || i == 9 ) finalStats[stats[i]].base = Math.floor(finalStats[stats[i]].base)
        
            if( i === 14 ) finalStats[stats[i]].base += ( 0.4 * finalStats["Agility"].base )

            if( stats[i] === "Defense" ) {
                finalStats[stats[8]].base += finalStats[stats[i]].base
                finalStats[stats[9]].base += finalStats[stats[i]].base
            }
            
            if( stats[i] === "Defense %" ) {
                finalStats[stats[8]].base += finalStats[stats[8]].base * finalStats[stats[i]].base
                finalStats[stats[9]].base += finalStats[stats[9]].base * finalStats[stats[i]].base
            }


        }
        
        finalStats["Armor"].base += finalStats["Defense"].base
        finalStats["Armor"].base += finalStats["Armor"].base * finalStats["Defense %"].base
        finalStats["Armor"].bonus += finalStats["Defense"].bonus
        finalStats["Armor"].bonus += finalStats["Armor"].bonus * finalStats["Defense %"].bonus

        finalStats["Resistance"].base += finalStats["Defense"].base
        finalStats["Resistance"].base += finalStats["Resistance"].base * finalStats["Defense %"].base
        finalStats["Resistance"].bonus += finalStats["Defense"].bonus
        finalStats["Resistance"].bonus += finalStats["Resistance"].bonus * finalStats["Defense %"].bonus
        
        for( i = 1; i < stats.length; ++i ) {

            if( stats[i].includes("_") ) continue
            if( i === 21 || i == 22 ) continue
            
            //FINAL STAT
            finalStats[stats[i]].base = finalStats[stats[i]].base && finalStats[stats[i]].base.toString().includes(".") ? Number(finalStats[stats[i]].base.toFixed(4)) : finalStats[stats[i]].base
            
            //SHIP BONUS
            finalStats[stats[i]].bonus = pct[i] 
                ? Number((Number(CR) * Number(SM) * finalStats[stats[i]].contribution).toFixed(4))
                : Math.floor(Number(CR) * Number(SM) * finalStats[stats[i]].contribution)

            if( stats[i].slice(-6) == "Rating" && finalStats[stats[i].slice(0,-6) + "Chance"] ) {
                
                finalStats[stats[i].slice(0,-6) + "Chance"].base = convertFlatCritToPercent( finalStats[stats[i]].base )
                finalStats[stats[i].slice(0,-6) + "Chance"].final = convertFlatCritToPercent( finalStats[stats[i]].base + finalStats[stats[i]].bonus )
                finalStats[stats[i].slice(0,-6) + "Chance"].bonus = finalStats[stats[i].slice(0,-6) + "Chance"].final - finalStats[stats[i].slice(0,-6) + "Chance"].base
                delete finalStats[stats[i].slice(0,-6) + "Chance"].contribution
                delete finalStats[stats[i]]
                
            } else if( i === 8 || i == 9 ) {
                
                finalStats[stats[i]].final = convertFlatDefToPercent( finalStats[stats[i]].base + finalStats[stats[i]].bonus, ship.level )
                finalStats[stats[i]].base = convertFlatDefToPercent( finalStats[stats[i]].base, ship.level )
                finalStats[stats[i]].bonus = finalStats[stats[i]].final - finalStats[stats[i]].base
                
                delete finalStats[stats[i]].contribution

            } else {

                //FINAL SHIP STAT
                finalStats[stats[i]].final = pct[i] 
                    ? Number(finalStats[stats[i]].base) + Number(finalStats[stats[i]].bonus)
                    : Math.floor(Number(finalStats[stats[i]].base) + Number(finalStats[stats[i]].bonus))

                delete finalStats[stats[i]].contribution
            }
                        
            if( !finalStats[stats[i]] || stats[i].includes("_") || finalStats[stats[i]].final <= 0 ) delete finalStats[stats[i]]
            else finalStats[stats[i]].final = pct[i] ? Number(finalStats[stats[i]].final.toFixed(4)) : Math.floor(finalStats[stats[i]].final)

        }

        //console.log( {unit:ship.defId, stats:finalStats} )
        
        STATS.push({unit:ship.defId, stats:finalStats})
    
    })

    return STATS

}

function convertFlatDefToPercent(value, level = 85, scale = 1) {
  return ((value / scale)/(level*5 + (value / scale))) * scale;//.toFixed(2);
}

function convertFlatCritToPercent(value, scale = 1) {
  return ((value / scale)/2400 + 0.1) * scale;//.toFixed(4);
}

