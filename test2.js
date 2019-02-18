/* --- Dependencies ---------------------------------- */

var wpi = require("node-wiring-pi")
wpi.setup('gpio')

// Setup sensors for detecting flag at bottom
var bottomsensorpin = 24
var topsensorpin = 25
var lightswitchpin = 23
wpi.pinMode(bottomsensorpin, wpi.INPUT)
wpi.pinMode(topsensorpin, wpi.INPUT)
wpi.pinMode(lightswitchpin, wpi.INPUT)


var ws281x = require('rpi-ws281x-native')

const channels = ws281x.init({
  dma: 5,
  freq: 800000,
  channels: [
    {count: 11, gpio: 18, invert: false, brightness: 100, stripType: 'sk6812w'}
  ]
});
const currentColorSet1 = channels[0].array;



/* --- System setup and processing loop ---------------------------------- */

var signals = {
  'SIGINT': 2,
  'SIGTERM': 15
};

function shutdown(signal, value) {
  process.nextTick(function () {
    process.exit(0);
  });
}

Object.keys(signals).forEach(function (signal) {
  process.on(signal, function () {
    shutdown(signal, signals[signal])
  });
});

function readBottomPositionFlagSensor() {
  return wpi.digitalRead(bottomsensorpin)
}

function readTopPositionFlagSensor() {
  return wpi.digitalRead(topsensorpin)
}

function readLightSwitch() {
  return wpi.digitalRead(lightswitchpin)
}

// 0xwwbbggrr
for (index1 = 0; index1 < 11; index1++) {
  currentColorSet1[index1] = 0x0000ff00
}


ws281x.render()

let spec = {
  address: 0x60,
  steppers: [{ W1: 'M1', W2: 'M2' }, { W1: 'M3', W2: 'M4' }]
};
var motorHat = require('motor-hat')(spec)
motorHat.init();
motorHat.steppers[0].setSteps(200);
motorHat.steppers[0].setSpeed({rpm:100});
motorHat.steppers[1].setSteps(200);
motorHat.steppers[1].setSpeed({rpm:100});

/*
setInterval(function () {
  
   console.log("top:", readTopPositionFlagSensor())
   console.log("bottom:", readBottomPositionFlagSensor())
   console.log("light switch:", readLightSwitch())

 }, 500)
 */
 /*
console.log("Start motor 1")
motorHat.steppers[0].step('back', 200, (err, result) => {
})
*/
console.log("Start motor 1")
motorHat.steppers[1].step('fwd', 200, (err, result) => {
  if (err) {
    console.log('Oh no, there was an error');
  } 
})
