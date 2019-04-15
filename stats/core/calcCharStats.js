module.exports = async ( units ) => {

    delete require.cache[require.resolve("./statEnum.js")]
    delete require.cache[require.resolve("../../common/data/statModSetList.json")]
    delete require.cache[require.resolve("../../common/data/statProgressionList.json")]
    delete require.cache[require.resolve("../../common/data/unitsList.json")]
    delete require.cache[require.resolve("../../common/data/equipmentList.json")]

    let { stats, base, pct } = require('./statEnum.js')
    let modSets = require('../../common/data/statModSetList.json')
    let STATS = []

    units.filter(u => u.combatType === 1).forEach( toon => {
    
        let finalStats = {}

        let unit = require('../../common/data/unitsList.json').find(u => u.id.includes(toon.defId) && u.rarity === toon.rarity)
        let sProgression = require('../../common/data/statProgressionList.json').find(s => s.id === unit.statProgressionId)
        
        for( i = 1; i < stats.length; ++i ) {

            let div = 100000000

            //BASE STAT
            let BS = unit.baseStat.statList.find(s => s.unitStat == i) || {}
                BS = BS.unscaledDecimalValue / div || 0
                BS += base[i]
            
            //STAT CONTRIBUTION
            let SC = 0
            let sls = sProgression.stat.statList.find(sd => sd.unitStat == i) || {}
            SC += sls.unscaledDecimalValue / div || 0

            //GEAR CONTRIBUTION
            let GS = unit.unitTierList.find(t => t.tier === toon.gear).baseStat.statList.find(s => s.unitStat == i) || {}
                GS = GS.unscaledDecimalValue / div || 0
            
            //EQUIPPED GEAR
            let EQ = toon.equipped.reduce((sum,eq) => {
                let pc = require('../../common/data/equipmentList.json').find(eqp => eqp.id === eq.equipmentId)
                let eqs = pc.equipmentStat.statList.find(s => s.unitStat == i) || {}
                    eqs = eqs.unscaledDecimalValue / div || 0
                return sum + eqs
            },0)

            //STAT MODIFIERS
            if( i >= 2 && i <= 4 ) { BS = Math.floor(( SC * toon.level ) + GS) }
            else BS = pct[i] ? (GS || BS) : Math.floor(GS || BS)
            
            finalStats[stats[i]] = { base:BS, gear:EQ, mods:0, final:0, pct:pct[i] }
            
        }
        
        for( i = 1; i < stats.length; ++i ) {
            
            let div = pct[i] ? 1000000 : 100000000

            if( i === 1 ) finalStats[stats[i]].base += ( 18.0 * finalStats["Strength"].base )
            if( i === 6 ) finalStats[stats[i]].base += ( 1.4 * finalStats[stats[unit.primaryUnitStat]].base )
            if( i === 7 ) finalStats[stats[i]].base += ( 2.4 * finalStats["Intelligence"].base )
            
            if( i === 8 ) finalStats[stats[i]].base += ( 0.14 * finalStats["Strength"].base )
            if( i === 8 ) finalStats[stats[i]].base += ( 0.07 * finalStats["Agility"].base )
            if( i === 9 ) finalStats[stats[i]].base += ( 0.1 * finalStats["Intelligence"].base )
            
            if( i === 8 || i == 9 ) finalStats[stats[i]].base = Math.floor(finalStats[stats[i]].base)
        

            if( i === 14 ) finalStats[stats[i]].base += ( 0.4 * finalStats["Agility"].base )
            if( i === 18 ) finalStats[stats[i]].base += 0.15

            //mods : MODS
            let setCount = {}
            let mods = toon.mods.reduce((sum,m) => {
                setCount[m.set] = setCount[m.set] || []
                setCount[m.set].push( m.level )
                let pri = m.primaryStat.unitStat === i ? m.primaryStat.value : 0
                return sum + pri + m.secondaryStat.reduce((ssum,ss) => {
                    return ssum + ( ss.unitStat === i ? ss.value : 0 )
                },0)
            },0) || 0
            
            
            // incorporate set modsets into stats totals
            let modset = modSets.find(ms => Object.keys(setCount).includes(ms.id) && ms.completeBonus.stat.unitStat === i)
            if( modset && setCount[modset.id].length >= modset.setCount ) {
                let mult = Math.floor(modset.setCount / setCount[modset.id].length)
                let maxd = Math.floor(modset.setCount / setCount[modset.id].filter(s => s === 15).length)
                mult -= maxd
                
                let sdiv = pct[modset.completeBonus.stat.unitStat] ? 1000000 : 100000000
                mods += maxd && maxd > 0 ? modset.completeBonus.stat.unscaledDecimalValue / sdiv * 2 * maxd : 0
                mods += mult && mult > 0 ? modset.completeBonus.stat.unscaledDecimalValue / sdiv * mult : 0
            }

            let statName = stats[i]
            if (statName.slice(-1) == "%") { // percent stat
                statName = statName.replace(" %","").trim()
                
                //mods = mods / 1000000
                //if( mods ) console.log(stats[i], mods)
                mods = mods / 100
                
                switch (statName) {
                    case "Offense":
                        finalStats["Physical Damage"].mods += finalStats["Physical Damage"].base * mods
                        finalStats["Special Damage"].mods += finalStats["Special Damage"].base * mods
                        break;
                    case "Defense":
                        finalStats["Armor"].mods += finalStats["Armor"].base * mods 
                        finalStats["Resistance"].mods += finalStats["Resistance"].base * mods 
                        break;
                    case "Potency":
                    case "Tenacity":
                    case "Critical Chance":
                    case "Critical Damage":
                        finalStats[statName].mods += finalStats[statName].base * mods
                        break;
                    default:
                        finalStats[statName].mods += finalStats[statName].base * mods
                }
            } else { // flat stat
                
                //mods = mods / 100000000
                //if( mods ) console.log(stats[i], mods)
                
                switch (statName) {
                    case "Offense":
                        finalStats["Physical Damage"].mods += mods
                        finalStats["Special Damage"].mods += mods
                        break;
                    case "Defense":
                        finalStats["Armor"].mods += mods
                        finalStats["Resistance"].mods += mods
                        break;
                    case "Critical Chance":
                        finalStats["Physical Critical Chance"].mods += mods / 100
                        finalStats["Special Critical Chance"].mods += mods / 100
                        break;
                    case "Potency":
                    case "Tenacity":
                    case "Critical Damage":
                        finalStats[statName].mods += mods / 100
                        break;
                    default:
                        finalStats[statName].mods += mods
                }
            }

        }

        for( i = 1; i < stats.length; ++i ) {
        
            if( i === 21 || i == 22 ) continue
        
            //FINAL STAT
            finalStats[stats[i]].base = finalStats[stats[i]].base && finalStats[stats[i]].base.toString().includes(".") ? Number(finalStats[stats[i]].base.toFixed(4)) : finalStats[stats[i]].base
            finalStats[stats[i]].mods = finalStats[stats[i]].mods && finalStats[stats[i]].mods.toString().includes(".") ? Number(finalStats[stats[i]].mods.toFixed(4)) : finalStats[stats[i]].mods
            
            //Accumulate gear and mods
            if( stats[i].slice(-6) == "Rating" && finalStats[stats[i].slice(0,-6) + "Chance"] ) {
                
                finalStats[stats[i].slice(0,-6) + "Chance"].base = convertFlatCritToPercent(finalStats[stats[i]].base)
                finalStats[stats[i].slice(0,-6) + "Chance"].final += convertFlatCritToPercent(finalStats[stats[i]].base + finalStats[stats[i]].gear)
                finalStats[stats[i].slice(0,-6) + "Chance"].final += finalStats[stats[i].slice(0,-6) + "Chance"].mods
                delete finalStats[stats[i]]
                
            } else if ( i === 8 || i === 9 ) {
                
                finalStats[stats[i]].final += finalStats[stats[i]].base + finalStats[stats[i]].gear
                
                let nonMod = convertFlatDefToPercent( finalStats[stats[i]].final, toon.level, 1)
                finalStats[stats[i]].mods = Math.floor(finalStats[stats[i]].mods)
                finalStats[stats[i]].final = convertFlatDefToPercent( finalStats[stats[i]].final + finalStats[stats[i]].mods, toon.level)
                finalStats[stats[i]].mods = finalStats[stats[i]].final - nonMod
                
            } else {
                finalStats[stats[i]].final += finalStats[stats[i]].base + finalStats[stats[i]].gear
                finalStats[stats[i]].final += finalStats[stats[i]].mods
            }
            
            
            if( !finalStats[stats[i]] || stats[i].includes("_") || finalStats[stats[i]].final <= 0 ) delete finalStats[stats[i]]
            else finalStats[stats[i]].final = pct[i] ? Number(finalStats[stats[i]].final.toFixed(4)) : Math.floor(finalStats[stats[i]].final)
            
        }
        
        //console.log( { unit:toon.defId, stats:finalStats } )
        
        STATS.push({ unit:toon.defId, stats:finalStats })
    
    })
    
    return STATS

}

function convertFlatDefToPercent(value, level = 85, scale = 1) {
  return ((value / scale)/(level*7.5 + (value / scale))) * scale;//.toFixed(2);
}

function convertFlatCritToPercent(value, scale = 1) {
  return ((value / scale)/2400 + 0.1) * scale;//.toFixed(4);
}

