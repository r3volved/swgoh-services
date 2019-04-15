const ReconnectingWebSocket = require('reconnecting-websocket');
module.exports = ( name, updateRoutine, verbose ) => {
    
    if( verbose ) console.log("UPDATEHOOK: Connecting to api")
    const uws = new ReconnectingWebSocket('wss://api.swgoh.help:3005/', [], {
        WebSocket: require('ws'),
        connectionTimeout: 2000,
        maxRetries: 10,
    })
    
    uws.addEventListener('error', (e) => {
        console.error("UPDATEHOOK: Socket Error")
        console.error(e)
    })
    
    uws.addEventListener('open', () => {
        if( verbose ) console.log("UPDATEHOOK: Identifying as updatehook")
        uws.send(JSON.stringify({
            action:"identify",
            method:"updatehook",
            criteria:[(new Date()).getTime(), name]
        }))
    })
    
    uws.addEventListener('message', (message) => {
        try { 
            if( verbose ) console.log("WS:", message.data)
            
            try { message.data = JSON.parse(message.data); } 
            catch(e) { message.data = message.data; }
            
            if( message.data.action ) {
                if( message.data.action === 'update' ) {
                    updateRoutine().then(result => {
                        uws.send(JSON.stringify({
                            sid:message.data.sid || null,
                            status:200,
                            result:result
                        }), console.error);
                    })
                } else if( message.data.action === 'identify' ) {
                    uws.send(JSON.stringify({
                        action:"identify",
                        method:"updatehook",
                        criteria:[(new Date()).getTime(), name]
                    }))
                }
            } else {
                if( verbose ) {
                    let ip = ( req.headers['x-forwarded-for'] 
                        ? req.headers['x-forwarded-for'].split(/\s*,\s*/)[0] 
                        : req.connection.remoteAddress
                    ).replace('::ffff:','')
                    console.log("UPDATEHOOK: Message from "+ip+" ...")
                    console.log("UPDATEHOOK: "+message.data)
                }
            }
            
        } catch(e) { 
            console.error("UPDATEHOOK: Message Error")
            console.error(e)
        }
    })
    
    const close = () => {
        if( uws && uws.close ) {
            if( verbose ) console.log("UPDATEHOOK: Closing websocket")
            uws.close()
        }
    }
    
    return { close:close }
}


