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
    console.log('>> '+req.ip+" >> "+req.url)
    next();
});

var fetchGuild = require('./core/fetchGuild.js')
app.use('/guild/:allycode', (req, res) => {
    return fetchGuild( req.params.allycode, res )
        .then(() => {
            return res.end()
        }).catch(e => { 
            console.error(e)
            return res.end(JSON.stringify({ error:e.message }))
        })
})

var fetchGuildRoster = require('./core/fetchGuildRoster.js')
app.use('/roster/:allycode', (req, res) => {
    return fetchGuildRoster( req.params.allycode, res )
        .then(() => {
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
