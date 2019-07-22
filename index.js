let rpgio = require('rpi-gpio')
let rp = rpgio.promise

let toggle = false

const magReader = 11
const relay = 13

rp.setup(relay, rpgio.DIR_LOW)
  .then(() => rp.setup(magReader, rpgio.DIR_IN, rpgio.EDGE_BOTH))
  .then(() => {
    setInterval(() =>{
      rp.read(magReader).then(value =>{
        console.log({value})
        rp.write(relay, !!value)
      })
    }, 10)
  })
  .catch(err => console.error(err))
