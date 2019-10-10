module.exports = async ( ships ) => {

    var { stats, base, pct } = require('./statEnum.js')
    var { tables } = require('../../common/data/index_gpTables.json')
    var index_skills = require('../../common/data/index_skills.json')
    var unitsList = require('../../common/data/unitsList.json')
    var statProgressionList = require('../../common/data/statProgressionList.json')

    var STATS = []

    ships.filter(s => s.combatType === 2).forEach( ship => {

        var finalStats = {}
        try {
            //CREW RATING
            //console.log("CREW:")
            if (Array.isArray(ship.crew)) {
                var CR = ship.crew.reduce((cr, cu) => {
                    var u = ships.find(ru => ru.defId === cu.unitId) || cu.unit
                    var uCR = 0
                    if( u ) {
                        uCR += tables.levelTable[(u.level || 0)]
                        uCR += tables.rarityTable[(u.rarity || 0)]
                        for( var g = 1; g < (u.gear || 0); ++g ) {
                            uCR += tables.gearTable[g] * 6
                        }
                        uCR += tables.gearTable[(u.gear || 0)] * (u.equipped ? u.equipped.length : 0)
                        if( u.skills ) {
                            u.skills.forEach( s => {
                                uCR += tables.abilityTable[s.tier]
                            })
                        }
                        if( u.mods ) {
                            u.mods.forEach(m => {
                                //var key = m.pips+":"+m.level+":"+m.tier+":"+m.set
                                //uCR +=parseInt(tables.modTable.find(mt => mt.key === key).value)
                                uCR += parseInt( tables.crewModTable[m.level][m.pips] )
                                //console.log( parseInt(tables.modTable.find(mt => mt.key === key).value), parseInt( tables.crewModTable[m.level][m.pips] ) )
                            })
                        }
                    }
                    return cr + uCR
                },0)
            }
            //console.log("CR: "+CR)
        } catch(e) { console.error(e) }

        //SHIP MULTIPLIER
        var SM = tables.multiplierTable[ship.rarity]
        //console.log("SM: "+SM)

        var unit = unitsList.find(u => u.baseId === ship.defId && u.rarity === ship.rarity)
        var sProgression = statProgressionList.find(s => s.id === unit.statProgressionId)
        var cProgression = statProgressionList.find(s => s.id === unit.crewContributionTableId)

        for( i = 1; i < stats.length; ++i ) {

            if( stats[i].includes("_") ) continue

            var div = 100000000

            //BASE STAT
            var BS = unit.baseStat.statList.find(s => s.unitStatId == i)
            BS = BS ? BS.unscaledDecimalValue / div : 0
            BS += base[i]

            //STAT CONTRIBUTION
            var sls = sProgression.stat.statList.find(sd => sd.unitStatId == i)
            var SC = sls ? sls.unscaledDecimalValue / div : 0

            var cls = cProgression.stat.statList.find(sd => sd.unitStatId == i)
            SC += cls ? cls.unscaledDecimalValue / div : 0

            //STAT MODIFIERS
            if( i >= 2 && i <= 4 ) {
                //console.log( unit.baseId, BS, SC * ship.level, sProgression.stat.statList.map(sl => sl.unitStatId) )
                BS += Math.floor( SC * ship.level ); SC = 0
            }
            else BS = pct[i] ? BS : Math.floor(BS)

            finalStats[stats[i]] = { base:Number(BS), contribution:Number(SC), bonus:0, final:0, pct:pct[i] }
        }


        for( var i = 1; i < stats.length; ++i ) {

            if( stats[i].includes("_") ) continue

            if( i === 1 ) finalStats[stats[i]].base += ( 18.0 * finalStats["Strength"].base )
            if( i === 6 ) finalStats[stats[i]].base += ( 1.4 * finalStats[stats[unit.primaryUnitStat]].base )
            if( i === 7 ) finalStats[stats[i]].base += ( 2.4 * finalStats["Intelligence"].base )

            if( i === 8 ) finalStats[stats[i]].base += ( 0.14 * finalStats["Strength"].base )
            if( i === 8 ) finalStats[stats[i]].base += ( 0.07 * finalStats["Agility"].base )
            if( i === 9 ) finalStats[stats[i]].base += ( 0.1 * finalStats["Intelligence"].base )

            if( i === 8 || i == 9 ) finalStats[stats[i]].base = Math.floor(finalStats[stats[i]].base)

            if( i === 14 ) finalStats[stats[i]].base += ( 0.4 * finalStats["Agility"].base )

        }

        for( var i = 1; i < stats.length; ++i ) {

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

                finalStats[stats[i]].final = convertFlatDefToPercent(finalStats[stats[i]].base + Math.floor(Number(CR) * Number(SM) * finalStats[stats[i]].contribution), ship.level, 1)
                finalStats[stats[i]].base = convertFlatDefToPercent( finalStats[stats[i]].base, ship.level, 1)
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

        STATS.push({unit:ship.defId, stats:Object.assign({},finalStats) })

        SM = null
        finalStats = null
        cProgression = null
        sProgression = null
        unit    = null
    })

    return STATS

}

function convertFlatDefToPercent(value, level = 85, scale = 1) {
    return (value / scale) / (300 + level*5 + (value / scale)) * scale;
}

function convertFlatCritToPercent(value, scale = 1) {
    return ((value / scale)/2400 + 0.1) * scale;//.toFixed(4);
}
