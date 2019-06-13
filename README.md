# swgoh-services
This repo contains microservices for:

* common (downloads and maintains game data)
* galactic power
* stats

There are also microservices which require / supplement the [premium version](https://www.patreon.com/user?u=470177) of the swgohNet [API client](https://github.com/r3volved/api-swgohNet)
* localization
* fetching a guild via the premium client

# Requirements

* All of the code is written in js and requires node
* The common microservice requires either an api.swgoh.help login or a premium API client.  If the premium API client is configured, it will be preferred.
* The localization service requires the premium client in order to download the localization bundles
* The guild fetch service is intended to facilitate using the premium client to fetch a guild roster in lieu of using the API

# Installation
For the first time installation, run `npm install` inside each service directory

# Running the services
On linux, the services can all be run with node.js via pm2.  The SERVER.sh provides a wrapper to load all of the services into pm2 for you.  Each service must be run with the current working directory matching where the server.js files are located.

# Environment variables
Each service accepts a PORT environment variable to determine what port to bind to.  This can be defined in a single line when running a service, such as `PORT=3201 node server.js`

The common service accepts in addition these environment variables:

* NAME - what the client's name should be when identifying itself to the API websocket
* DEBUG - when true, turns on verbose logging messages
* FORCE - when true, forces a game asset and localization update
* INDEX - when true, forces the creation of an index to do quicker lookups across ability/skills etc.  Index is created if game data is updated.
* CLIENT - address of the premium API client's end point.  Defaults to http://localhost://3110
* THROTTLE - defaults to 500 msec. Used to throttle requests to the premium client to comply with the 2 requests / second constraint
* USER - (optional) api.swgoh.help account password
* PASS - (optional) api.swgoh.help account password

Do not specify the user and password if you would like to use the premium client.

# Example pseudocode of using the stat calculator

```js
const {result} = await swgoh.fetchPlayer({
    allycode: '123456789'
});
let player = result[0];
let charStats;
let shipStats;

// Get the stats for all the characters
charStats =  await nodeFetch("http://localhost:3201/char", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // combatType 1 is character
    body: JSON.stringify(player.roster.filter(u => u.combatType === 1))
}).then(res => res.json());

// Then get all the stats for the ships (coming soon tm)
shipStats = await nodeFetch("http://localhost:3201/ship", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // combatType 2 is ships
    body: JSON.stringify(player.roster.filter(u => u.combatType === 2))
}).then(res => res.json());
```