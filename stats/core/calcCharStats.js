module.exports = async ( units ) => {

    var { stats, base, pct } = require('./statEnum.js')
    var unitsList = require('../../common/data/unitsList.json')
    var statProgressionList = require('../../common/data/statProgressionList.json')
    var equipmentList = require('../../common/data/equipmentList.json')
    var modSets = require('../../common/data/statModSetList.json')

    var STATS = []

    units.filter(u => u.combatType === 1).forEach( toon => {

        if( toon.combatType === 2 ) return

        var finalStats = {}

        var unit = unitsList.find(u => u.baseId === toon.defId && u.rarity === toon.rarity)
        var sProgression = statProgressionList.find(s => s.id === unit.statProgressionId)

        for( var i = 1; i < stats.length; ++i ) {

            var div = 100000000

            //BASE STAT
            var BS = base[i] + ((unit.baseStat.statList.find(s => s.unitStatId == i) || {}).unscaledDecimalValue / div || 0)

            //STAT CONTRIBUTION
            var SC = (sProgression.stat.statList.find(sd => sd.unitStatId == i) || {}).unscaledDecimalValue / div || 0

            //GEAR CONTRIBUTION
            if( !unit.unitTierList.find(t => t.tier === toon.gear) ) console.log( "ID ERROR:"+unit.baseId )
            var GS = unit.unitTierList.find(t => t.tier === toon.gear) ? (unit.unitTierList.find(t => t.tier === toon.gear).baseStat.statList.find(s => s.unitStatId == i) || {}).unscaledDecimalValue / div : 0

            //EQUIPPED GEAR
            var EQ = toon.equipped.reduce((sum,eq) => {
                var pc = equipmentList.find(eqp => eqp.id === eq.equipmentId)
                var eqs = (pc.equipmentStat.statList.find(s => s.unitStatId == i) || {}).unscaledDecimalValue / div || 0
                return sum + eqs
            },0)

            //STAT MODIFIERS
            if( i >= 2 && i <= 4 ) { BS = Math.floor(( SC * toon.level ) + GS) }
            else BS = pct[i] ? (GS || BS) : Math.floor(GS || BS)

            finalStats[stats[i]] = { base:BS, gear:EQ, mods:0, final:0, pct:pct[i] }

        }

        sProgression = null

        for( var i = 1; i < stats.length; ++i ) {

            var div = pct[i] ? 1000000 : 100000000

            if( i === 1 ) finalStats[stats[i]].base += ( 18.0 * (finalStats["Strength"].base + finalStats["Strength"].gear)  )
            if( i === 6 ) finalStats[stats[i]].base += ( 1.4 * (finalStats[stats[unit.primaryUnitStat]].base + finalStats[stats[unit.primaryUnitStat]].gear))
            if( i === 7 ) finalStats[stats[i]].base += ( 2.4 * (finalStats["Intelligence"].base + finalStats["Intelligence"].gear) )

            if( i === 8 ) finalStats[stats[i]].base += ( 0.14 * (finalStats["Strength"].base + finalStats["Strength"].gear))
            if( i === 8 ) finalStats[stats[i]].base += ( 0.07 * (finalStats["Agility"].base + finalStats["Agility"].gear))
            if( i === 9 ) finalStats[stats[i]].base += ( 0.1 * (finalStats["Intelligence"].base + finalStats["Intelligence"].gear))

            if( i === 8 || i == 9 ) finalStats[stats[i]].base = Math.floor(finalStats[stats[i]].base)


            if( i === 14 ) finalStats[stats[i]].base += ( 0.4 * (finalStats["Agility"].base + finalStats["Agility"].gear))
            if( i === 18 ) finalStats[stats[i]].base += 0.15

            //mods : MODS
            var setCount = {}
            var mods = toon.mods.reduce((sum,m) => {
                setCount[m.set] = setCount[m.set] || []
                setCount[m.set].push( m.level )
                var pri = m.primaryStat.unitStat === i ? m.primaryStat.value : 0
                return sum + pri + m.secondaryStat.reduce((ssum,ss) => {
                    return ssum + ( ss.unitStat === i ? ss.value : 0 )
                },0)
            },0) || 0

            // incorporate set modsets into stats totals
            var modset = modSets.find(ms => Object.keys(setCount).includes(ms.id) && ms.completeBonus.stat.unitStatId === i)
            if( modset && setCount[modset.id].length >= modset.setCount ) {
                var mult = Math.floor(setCount[modset.id].length / modset.setCount)
                var maxd = Math.floor(setCount[modset.id].filter(s => s === 15).length / modset.setCount)
                mult -= maxd

                //if( modset && stats[i].includes("Health") && toon.defId.startsWith("G") )
                //    console.log( toon.defId, stats[i], modset.setCount, mult, maxd )

                var sdiv = pct[modset.completeBonus.stat.unitStatId] ? 1000000 : 100000000
                mods += maxd && maxd > 0 ? modset.completeBonus.stat.unscaledDecimalValue / sdiv * 2 * maxd : 0
                mods += mult && mult > 0 ? modset.completeBonus.stat.unscaledDecimalValue / sdiv * mult : 0
            }

            var statName = stats[i]
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
                    case "Critical Avoidance":
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
                    case "Critical Avoidance":
                        finalStats[statName].mods += mods / 100
                        break;
                    default:
                        finalStats[statName].mods += mods
                }
            }

        }

        for( var i = 1; i < stats.length; ++i ) {

            if( i === 21 || i == 22 ) continue

            //FINAL STAT
            finalStats[stats[i]].base = finalStats[stats[i]].base && finalStats[stats[i]].base.toString().includes(".") ? Number(finalStats[stats[i]].base.toFixed(4)) : Math.floor(finalStats[stats[i]].base)
            finalStats[stats[i]].gear = finalStats[stats[i]].gear && finalStats[stats[i]].gear.toString().includes(".") ? Number(finalStats[stats[i]].gear.toFixed(4)) : Math.floor(finalStats[stats[i]].gear)
            finalStats[stats[i]].mods = finalStats[stats[i]].mods && finalStats[stats[i]].mods.toString().includes(".") ? Number(finalStats[stats[i]].mods.toFixed(4)) : Math.floor(finalStats[stats[i]].mods)

            //Accumulate gear and mods
            if( stats[i].slice(-6) == "Rating" && finalStats[stats[i].slice(0,-6) + "Chance"] ) {

                finalStats[stats[i].slice(0,-6) + "Chance"].base = convertFlatCritToPercent(finalStats[stats[i]].base)
                finalStats[stats[i].slice(0,-6) + "Chance"].final += convertFlatCritToPercent(finalStats[stats[i]].base + finalStats[stats[i]].gear)
                finalStats[stats[i].slice(0,-6) + "Chance"].final += finalStats[stats[i].slice(0,-6) + "Chance"].mods
                delete finalStats[stats[i]]

            } else if ( i === 8 || i === 9 ) {

                finalStats[stats[i]].final += finalStats[stats[i]].base + finalStats[stats[i]].gear

                var nonMod = convertFlatDefToPercent( finalStats[stats[i]].final, toon.level, 1)
                finalStats[stats[i]].mods = Math.floor(finalStats[stats[i]].mods)
                finalStats[stats[i]].final = convertFlatDefToPercent( finalStats[stats[i]].final + finalStats[stats[i]].mods, toon.level)
                finalStats[stats[i]].mods = finalStats[stats[i]].final - nonMod

            } else {
                finalStats[stats[i]].final += finalStats[stats[i]].base + finalStats[stats[i]].gear
                finalStats[stats[i]].final += finalStats[stats[i]].mods
            }


            if( !finalStats[stats[i]] || stats[i].includes("_") || finalStats[stats[i]].final <= 0 ) delete finalStats[stats[i]]
            else finalStats[stats[i]].final = finalStats[stats[i]].pct ? Number(finalStats[stats[i]].final.toFixed(4)) : Math.floor(finalStats[stats[i]].final)

        }

        //console.log( { unit:toon.defId, stats:finalStats } )

        STATS.push({ unit:toon.defId, stats:Object.assign({},finalStats) })

        finalStats = null
        unit    = null

    })

    return STATS

}

function convertFlatDefToPercent(value, level = 85, scale = 1) {
  return ((value / scale)/(level*7.5 + (value / scale))) * scale;//.toFixed(2);
}

function convertFlatCritToPercent(value, scale = 1) {
  return ((value / scale)/2400 + 0.1) * scale;//.toFixed(4);
}
