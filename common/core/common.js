const JSZip = require("jszip");
const fetch = require('node-fetch')
const fs = require('fs')

const name = process.env.NAME || "ARIES Server Update"
const debug = process.env.DEBUG || false
const force = process.env.FORCE || false
const index = process.env.INDEX || false
const client = process.env.CLIENT || "http://localhost:3110"

if( debug ) console.log(name+" has started")

const update = async () => {
    try {
        
    
        let oldMetadata = {}
        if( debug ) console.log("Requiring /data/metadata.json")
        try { 
            delete require.cache[require.resolve("./../data/metadata.json")]
            oldMetadata = require("./../data/metadata.json") 
        } catch(e) {}
        
        if( debug ) console.log("Fetching metadata")
        let metadata = await fetch(client+"/swapi/metadata?nocon=true").then(res => res.json())
        
        //Compare versions
        let vg = metadata.latestGamedataVersion === oldMetadata.latestGamedataVersion
        let vl = metadata.latestLocalizationBundleVersion === oldMetadata.latestLocalizationBundleVersion
        let updated = false
        
        //Update language
        if( !vl || force ) {
            if( debug ) console.log("Fetching new language bundle")
            let localization = await fetch(client+"/swapi/localization/"+metadata.latestLocalizationBundleVersion+"?nocon=true").then(res => res.text())

            //Open the zip in memory
            let zipped = await (new JSZip()).loadAsync(localization, {base64:true});
            for( let file in zipped.files ) {

                //Get language name from filename
                let lang = zipped.files[file].name.replace(/(Loc_)|(.txt)/gi,'');

                //Get file content and split into each line
                let lines = (await zipped.files[file].async("string")).toString().split(/\n/g);

                //Iterate each line and build language index
                let outfile = [];
                for( l = 0; l < lines.length; ++l ) {
                    if( lines[l].startsWith('#') ) continue
                    let [ key, val ] = lines[l].split(/\|/g).map(s => s.trim());
                    if( !key || !val ) continue
                    outfile.push({ id:key, value:val });
                }
                
                try { 
                    if( debug ) console.log("Saving /data/"+lang+".json")
                    await fs.writeFileSync("./data/"+lang+".json", JSON.stringify(outfile,0,2), 'utf8') 
                } catch(e) {
                    if( debug ) console.error("! Could not save /data/"+lang+".json")
                }

                delete zipped.files[file]
                
            }                
            zipped = null
            localization = null
            updated = true                
        } 
        
        if( debug ) console.log("+ Language up to date")
            
        //Update gamedata
        if( !vg || force ) {
            if( debug ) console.log("Fetching new gamedata")
            let gamedata = await fetch(client+"/swapi/gamedata/"+metadata.latestGamedataVersion+"?nocon=true").then(res => res.json())
            for( let dataKey in gamedata ) {
                try { 
                    if( debug ) console.log("Saving /data/"+dataKey+".json")
                    await fs.writeFileSync("./data/"+dataKey+".json", JSON.stringify(gamedata[dataKey],0,2), 'utf8') 
                } catch(e) {
                    if( debug ) console.error("! Could not save /data/"+dataKey+".json")
                }
                delete gamedata[dataKey]
            }
            gamedata = null            
            updated = true
        }

        if( debug ) console.log("+ Gamedata up to date")

        if( updated || force ) {
            //Update metadata
            try { 
                if( debug ) console.log("Saving /data/metadata.json")
                await fs.writeFileSync("./data/metadata.json", JSON.stringify(metadata,0,2), 'utf8') 
            } catch(e) {
                if( debug ) console.error("! Could not save /data/metadata.json")
            }
        }
        
        if( debug ) console.log("+ Metadata up to date")
        metadata = null
        oldMetadata = null

        //Update quick-indexing
        if( updated || index ) {
            
            //Build unit index and get skill id's for attainable units
            let skillIds = await require('./index-units.js')( fs, debug )
            
            //Build skill index from ids - merge skills with abilities 
            await require('./index-skills.js')( fs, skillIds, debug )

            //Build gp tables index
            await require('./index-gpTables.js')( fs, debug )
         
            skillIds = null
               
        }
        
        if( debug ) console.log("\n+ Common data is up to date")        
        
    } catch(e) {
        console.error("! Update Hook Error !")
        console.error(e)
    }
}

const hook = require('./update-hook.js')( name, update, debug )

const close = ( code ) => {
    if( debug ) console.log(code)
    if( hook && hook.close ) hook.close()
    if( debug ) console.log(name+" has shutdown")
    process.exit(code)
}
process.on('SIGINT',close)
process.on('SIGTERM',close)

if( process.env.INIT ) update()

