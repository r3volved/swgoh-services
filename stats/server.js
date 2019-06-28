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
});

//Expects (filterale) player.roster - where crew members are among the roster
var calcStats = require('./core/calcStats.js')
app.use('/stats', bodyParser.json({limit:'4mb'}), (req, res) => {
    return calcStats( req.body )
        .then(stats => JSON.parse(JSON.stringify(stats)))
        .then(stats => {
            //console.log(stats)
            res.write( JSON.stringify(stats) )
            return res.end()
        }).catch(e => { 
            console.error(e)
            return res.end(JSON.stringify({ error:e.message }))
        })
})

//Expects (filterale) player.roster - where crew members are among the roster
var calcShipStats = require('./core/calcShipStats.js')
app.use('/ship', bodyParser.json({limit:'4mb'}), (req, res) => {
    return calcShipStats( req.body )
        .then(stats => JSON.parse(JSON.stringify(stats)))
        .then(stats => {
            res.write( JSON.stringify(stats) )
            return res.end()
        }).catch(e => { 
            console.error(e)
            return res.end(JSON.stringify({ error:e.message }))
        })
})

//Expects (filterale) player.roster
var calcCharStats = require('./core/calcCharStats.js')
app.use('/char', bodyParser.json({limit:'4mb'}), (req, res) => {
    return calcCharStats( req.body )
        .then(stats => JSON.parse(JSON.stringify(stats)))
        .then(stats => {
            res.write( JSON.stringify(stats) )
            return res.end()
        }).catch(e => { 
            console.error(e)
            return res.end(JSON.stringify({ error:e.message }))
        })
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
    console.log(`Stat generator is listening on port ${listener.address().port}`)
})
