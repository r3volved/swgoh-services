let debug = process.env.DEBUG 
let iSkills = require('../../common/data/index_skills.json')
let gpTables = require('../../common/data/index_gpTables.json').tables

module.exports = async ( units ) => {
    
    var GP = []
    
    for( var un of units ) {            
        if( un.combatType === 2 ) { continue; }
        un.gp = Math.round( await calcCharGP( un ) );
        GP.push({ unit:un.defId, gp:un.gp })
    }											

    //Do ship gp
    for( var un of units ) {
        if( un.combatType === 1 ) { continue; }
        if( un.crew ) {
            for( var cmem of un.crew ) {
	            let u = units.filter(pr => pr.defId === cmem.unitId);
	            cmem.gp = u[0].gp;
	            cmem.cp = await calcCrewRating( cmem.gp, un );				        
            }
        }
        un.gp = Math.round( await calcShipGP( un ) );
        GP.push({ unit:un.defId, gp:un.gp })
    }
    
    return GP
    
}


function calcModGP( modList, raw ) {
    try {
        //pips:level:tier:set?
        //1:1:1:0 -> 7:15:5:8
        var gpMod = 0;
        if( raw ) {
            modList.forEach( m => {
                var key = m.definitionId.charAt(1)+":"+m.level+":"+m.tier+":"+m.definitionId.charAt(0); 
                gpMod += parseInt(gpTables.modTable.find(k => k.key === key).value);
            });
        } else {
            modList.forEach( m => {
                var key = m.pips+":"+m.level+":"+m.tier+":"+m.set; 
                gpMod += parseInt(gpTables.modTable.find(k => k.key === key).value);
            });
        }
        return gpMod;        
    } catch(e) { 
        console.error(e); 
        return 0    
    }
}

function calcAbilityGP( abilityList ) {
    try {
        var gpAbility = 0;
        abilityList.forEach( a => {
            var iskill = iSkills.find(i => i.id === a.id)
            var otag = iskill.tiers[0].powerOverrideTag || ""
            if( a.id.includes('contract') || otag.includes('contract') ) {
            	gpAbility += Number(gpTables.contractTable[(a.tier || 0)]);
            } else if( a.id.includes('hardware') || otag.includes('reinforcement') ) {
            	gpAbility += Number(gpTables.reinforcementTable[(a.tier || 0)]);
            } else {
            	gpAbility += a.tier === 8 && a.isZeta ? Number(gpTables.abilityTable[a.tier+1]) : Number(gpTables.abilityTable[(a.tier || 0)]);
            }
        });
        return gpAbility;        
    } catch(e) { 
        console.error(e); 
        return 0    
    }
}

function calcGearGP( tier, equipped ) {
    try {
        var gpGear = 0;
        for( var g = 1; g < tier; ++g ) {
        	gpGear += Number(gpTables.gearTable[g]) * 6;
        }
        gpGear += Number(gpTables.gearTable[tier]) * equipped.length;
        return gpGear;
    } catch(e) { 
        console.error(e); 
        return 0    
    }
}



// === /player GP 

function calcCharGP( unit ) {
    try {
    
        if( !unit ) { return false; }
        
        var gpModifier  = 1.5;
        var gpMod       = calcModGP( unit.mods );
        var gpAbility   = calcAbilityGP( unit.skills );
        var gpGear      = calcGearGP( unit.gear, unit.equipped );
        var gpRarity    = gpTables.rarityTable[ unit.rarity ];
        var gpLevel     = gpTables.levelTable[ unit.level ];

        if( debug ) console.log( gpMod, gpAbility, gpGear, gpRarity, gpLevel )
        
        return Math.round(( gpMod + gpAbility + gpGear + gpRarity + gpLevel ) * gpModifier);
                
    } catch(e) { 
        console.error(e); 
        return 0    
    }
}

function calcCrewRating( gp, ship ) {
    try {
    
        return Math.round((gp * gpTables.multiplierTable[ ship.rarity ]) * gpTables.crewSizeTable[ship.crew.length]);
                
    } catch(e) { 
        console.error(e); 
        return 0    
    }
}


function calcShipGP( unit ) {
    try {
    
        if( !unit || !unit.crew ) { return 'error'; }
        
        var gpRarity    = parseFloat(gpTables.rarityTable[ unit.rarity ]);
        var gpCrewSize  = parseFloat(gpTables.crewSizeTable[unit.crew.length]);
        var gpLevel     = parseFloat(gpTables.levelTable[ unit.level ]);
        var gpAbility   = parseFloat(calcAbilityGP( unit.skills ));
        var gpModifier  = parseFloat(gpTables.multiplierTable[unit.rarity]);        
        
        var gpCrewPower = 0;
        var gpShipPower = 0;
        var gpCrew = 0;
        
        unit.crew.forEach( cmem => {
        	gpCrewPower += parseFloat(cmem.cp);
        	gpCrew += parseFloat(cmem.gp);
        });
        
        gpCrew = gpCrew * gpModifier * gpCrewSize;
        gpShipPower = Math.round(( gpCrew / 2 ) + (( gpLevel + gpAbility ) * 1.5));

        if( debug ) console.log( gpRarity, gpCrewSize, gpLevel, gpAbility, gpModifier, gpCrewPower, gpShipPower, gpCrew )
        
        return gpCrewPower + gpShipPower;
          
    } catch(e) { 
        console.error(e); 
        return 0    
    }
}

