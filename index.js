const gpio = require('rpi-gpio')
const rp = gpio.promise
const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const config = require('./config.json')

const basicAuth = require('express-basic-auth')

const {password} = config

const auth = basicAuth({
  challenge: true,
  users: { 'garage': password }
})

if(password === "UNCONFIGURED"){
  app.all("*", (req, res) =>{
    res.status(503)
      .send("Server not configured. Please setup a password in config.json")
  })
}


// gpio.on('change', function(channel, value) {
//   console.log('Channel ' + channel + ' value is now ' + value);
// });

const magReaderPIN = 11
const relayPIN = 13

let setupPromises = [
  rp.setup(relayPIN, gpio.DIR_LOW),
  // rp.setup(magReaderPIN, gpio.DIR_IN, gpio.EDGE_BOTH),
  rp.setup(magReaderPIN, gpio.DIR_IN),
]
// parse application/json
app.use(bodyParser.json())
app.use(auth, express.static(path.join(__dirname, 'public')))
app.get('/doorStatus', auth, function (req, res) {
  rp.read(magReaderPIN).then(value =>{
    console.log('doorStatus hit', {doorIsClosed:value})
    res.json({doorIsClosed:value})
  })
})

const toggleGarageDoor = () => rp.write(relayPIN, true)
  .then(()=>{
    setTimeout(() =>{
      rp.write(relayPIN, false)
    }, 500)
  })
  .catch(console.error)
app.post('/trigger', auth, (req, res) => {
  toggleGarageDoor()
  res.send('toggled')
})
app.post('/hitGarageButton', async (req, res) =>{
  console.log('hitGarageButton hit')
  if(req.body.password === password) {
    toggleGarageDoor()
    res.sendStatus(200)
  }
  else{
    res.sendStatus(401)
  }
})

Promise.all(setupPromises)
  .then(() => {
    app.listen(8080)
    console.log('listening on port 8080')
  })
  .catch(console.error)

