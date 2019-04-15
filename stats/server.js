// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    req.ip = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(/\s*,\s*/)[0] 
        : req.connection.remoteAddress;
    req.ip = req.ip.replace('::ffff:','');
    console.log('>> '+req.ip+" >> "+req.url)
    next();
});

//Expects (filterale) player.roster - where roster-unit.crew[].unit is the crew member roster-unit
app.use('/ship', bodyParser.json({limit:'4mb'}), (req, res) => {
    require('./core/calcShipStats.js')( req.body )
        .then(stats => JSON.parse(JSON.stringify(stats)))
        .then(stats => {
            res.write( JSON.stringify(stats) )
            res.end()
        }).catch(e => { 
            res.end(JSON.stringify({ error:e.message }))
        })
})

//Expects (filterale) player.roster
app.use('/char', bodyParser.json({limit:'4mb'}), (req, res) => {
    require('./core/calcCharStats.js')( req.body )
        .then(stats => JSON.parse(JSON.stringify(stats)))
        .then(stats => {
            res.write( JSON.stringify(stats) )
            res.end()
        }).catch(e => { 
            res.end(JSON.stringify({ error:e.message }))
        })
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
    console.log(`Stat generator is listening on port ${listener.address().port}`)
})
