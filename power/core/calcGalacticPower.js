let debug = process.env.DEBUG 
let iSkills = null
let gpTables = null

module.exports = async ( units ) => {

    delete require.cache[require.resolve("../../common/data/index_skills.json")]
    delete require.cache[require.resolve("../../common/data/index_gpTables.json")]
    
    iSkills = require('../../common/data/index_skills.json')
    gpTables = require('../../common/data/index_gpTables.json').tables

    let GP = []
    
    for( let un of units ) {            
        if( un.combatType === 2 ) { continue; }
        un.gp = Math.round( await calcCharGP( un ) );
        GP.push({ unit:un.defId, gp:un.gp })
    }											

    //Do ship gp
    for( let un of units ) {
        if( un.combatType === 1 ) { continue; }
        if( un.crew ) {
            for( let cmem of un.crew ) {
	            let u = units.filter(pr => pr.defId === cmem.unitId);
	            cmem.gp = u[0].gp;
	            cmem.cp = await calcCrewRating( cmem.gp, un );				        
            }
        }
        un.gp = Math.round( await calcShipGP( un ) );
        GP.push({ unit:un.defId, gp:un.gp })
    }
    
    iSkills = null
    gpTables = null
    
    return GP
    
}


function calcModGP( modList, raw ) {
    try {
        //pips:level:tier:set?
        //1:1:1:0 -> 7:15:5:8
        let gpMod = 0;
        if( raw ) {
            modList.forEach( m => {
                let key = m.definitionId.charAt(1)+":"+m.level+":"+m.tier+":"+m.definitionId.charAt(0); 
                gpMod += parseInt(gpTables.modTable.find(k => k.key === key).value);
            });
        } else {
            modList.forEach( m => {
                let key = m.pips+":"+m.level+":"+m.tier+":"+m.set; 
                gpMod += parseInt(gpTables.modTable.find(k => k.key === key).value);
            });
        }
        return gpMod;        
    } catch(e) { console.error(e); }
}

function calcAbilityGP( abilityList ) {
    try {
        let gpAbility = 0;
        abilityList.forEach( a => {
            let iskill = iSkills.find(i => i.id === a.id)
            let otag = iskill.tiers[0].powerOverrideTag || ""
            if( a.id.includes('contract') || otag.includes('contract') ) {
            	gpAbility += Number(gpTables.contractTable[(a.tier || 0)]);
            } else if( a.id.includes('hardware') || otag.includes('reinforcement') ) {
            	gpAbility += Number(gpTables.reinforcementTable[(a.tier || 0)]);
            } else {
            	gpAbility += a.tier === 8 && a.isZeta ? Number(gpTables.abilityTable[a.tier+1]) : Number(gpTables.abilityTable[(a.tier || 0)]);
            }
        });
        return gpAbility;        
    } catch(e) { console.error(e); }
}

function calcGearGP( tier, equipped ) {
    try {
        let gpGear = 0;
        for( let g = 1; g < tier; ++g ) {
        	gpGear += Number(gpTables.gearTable[g]) * 6;
        }
        gpGear += Number(gpTables.gearTable[tier]) * equipped.length;
        return gpGear;
    } catch(e) { console.error(e); }
}



// === /player GP 

function calcCharGP( unit ) {
    try {
    
        if( !unit ) { return false; }
        
        const gpModifier  = 1.5;
        const gpMod       = calcModGP( unit.mods );
        const gpAbility   = calcAbilityGP( unit.skills );
        const gpGear      = calcGearGP( unit.gear, unit.equipped );
        const gpRarity    = gpTables.rarityTable[ unit.rarity ];
        const gpLevel     = gpTables.levelTable[ unit.level ];

        if( debug ) console.log( gpMod, gpAbility, gpGear, gpRarity, gpLevel )
        
        return Math.round(( gpMod + gpAbility + gpGear + gpRarity + gpLevel ) * gpModifier);
                
    } catch(e) { console.error(e); }    
}

function calcCrewRating( gp, ship ) {
    try {
    
        return Math.round((gp * gpTables.multiplierTable[ ship.rarity ]) * gpTables.crewSizeTable[ship.crew.length]);
                
    } catch(e) { console.error(e); }    
}


function calcShipGP( unit ) {
    try {
    
        if( !unit || !unit.crew ) { return 'error'; }
        
        const gpRarity    = parseFloat(gpTables.rarityTable[ unit.rarity ]);
        const gpCrewSize  = parseFloat(gpTables.crewSizeTable[unit.crew.length]);
        const gpLevel     = parseFloat(gpTables.levelTable[ unit.level ]);
        const gpAbility   = parseFloat(calcAbilityGP( unit.skills ));
        const gpModifier  = parseFloat(gpTables.multiplierTable[unit.rarity]);        
        
        let gpCrewPower = 0;
        let gpShipPower = 0;
        let gpCrew = 0;
        
        unit.crew.forEach( cmem => {
        	gpCrewPower += parseFloat(cmem.cp);
        	gpCrew += parseFloat(cmem.gp);
        });
        
        gpCrew = gpCrew * gpModifier * gpCrewSize;
        gpShipPower = Math.round(( gpCrew / 2 ) + (( gpLevel + gpAbility ) * 1.5));

        if( debug ) console.log( gpRarity, gpCrewSize, gpLevel, gpAbility, gpModifier, gpCrewPower, gpShipPower, gpCrew )
        
        return gpCrewPower + gpShipPower;
          
    } catch(e) { console.error(e); }    
}

