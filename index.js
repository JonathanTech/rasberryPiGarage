const gpio = require('rpi-gpio')
const rp = gpio.promise
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

gpio.on('change', function(channel, value) {
  console.log('Channel ' + channel + ' value is now ' + value);
});

const magReaderPIN = 11
const relayPIN = 13

let setupPromises = [
  rp.setup(relayPIN, gpio.DIR_LOW),
  // rp.setup(magReaderPIN, gpio.DIR_IN, gpio.EDGE_BOTH),
  rp.setup(magReaderPIN, gpio.DIR_IN),
]
// parse application/json
app.use(bodyParser.json())

app.get('/doorStatus', function (req, res) {
  rp.read(magReaderPIN).then(value =>{
    console.log('doorStatus hit', {doorIsClosed:value})
    res.json({doorIsClosed:value})
  })
})

const toggleGarageDoor = () => rp.write(relayPIN, true)
  .then(()=>{
    setTimeout(() =>{
      rp.write(relayPIN, false)
    }, 50)
  })

app.post('/hitGarageButton', async (req, res) =>{
  console.log('hitGarageButton hit')
  if(req.body.password === 'bob') {
    toggleGarageDoor()
    res.send('toggled')
  }
  else{
    res.sendStatus(401)
  }
})

Promise.all(setupPromises)
  .then(() => {
    app.listen(3000)
    console.log('listening on port 3000')
  })
  .catch(err => console.error(err))

