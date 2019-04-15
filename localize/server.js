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

//Expects any json with localization key values
app.use('/lang/:language', bodyParser.json({limit:'4mb'}), async (req, res) => {
    try {
        let dstr = JSON.stringify(req.body)
        let lang = (req.params.language || 'eng_us').toUpperCase()

        delete require.cache[require.resolve("../common/data/"+lang+".json")]
        let strings = require("../common/data/"+lang+".json").filter(s => dstr.match(new RegExp("\""+s.id+"\"",'gm')))
            strings.sort((a,b) => b.id.length - a.id.length)
            strings.forEach(s => {
                dstr = dstr.replace(new RegExp( JSON.stringify(s.id), 'gm' ), JSON.stringify(s.value))
            })
        
        res.write( JSON.stringify(JSON.parse(dstr)) )
    } catch(e) {
        res.write(JSON.stringify({ error:e.message }))
        console.log(e)
    }
    res.end()
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
    console.log(`Localizer is listening on port ${listener.address().port}`)
})
