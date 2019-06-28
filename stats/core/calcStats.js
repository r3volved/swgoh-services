module.exports = async ( units ) => {

    var charStats = await require('./calcCharStats.js')( units )
    var shipStats = await require('./calcShipStats.js')( units )
    return charStats.concat( shipStats )

}
