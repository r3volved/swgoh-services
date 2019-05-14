// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    req.ip = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(/\s*,\s*/)[0] 
        : req.connection.remoteAddress;
    req.ip = req.ip.replace('::ffff:','');
    //console.log('>> '+req.ip+" >> "+req.url)
    next();
})

//Expects (filterale) player.roster - ship crew must be included in roster
var calcGalacticPower = require('./core/calcGalacticPower.js')
app.use('/gp', bodyParser.json({limit:'4mb'}), (req, res) => {
    return calcGalacticPower( req.body )
        .then(power => JSON.parse(JSON.stringify(power)))
        .then(power => {
            res.write( JSON.stringify(power) )
            return res.end()
        }).catch(e => { 
            console.error(e)
            return res.end(JSON.stringify({ error:e.message }))
        })
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
    console.log(`Power calculator is listening on port ${listener.address().port}`)
})
