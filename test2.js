
var ws281x = require('rpi-ws281x-native')
const channels = ws281x.init({
  dma: 10,
  freq: 800000,
  channels: [
    {count: 8, gpio: 18, invert: false, brightness: 100, stripType: 'sk6812w'}
  ]
});
const currentColorSet1 = channels[0].array;

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

// Generate integer from RGB value
function colorCombine(r, g, b, w) {
  return ((w & 0xff) << 24) + ((b & 0xff) << 16) + ((g & 0xff) << 8) + (r & 0xff)
}

// 0xwwbbggrr

currentColorSet1[4] = colorCombine(255,0,0,0)
currentColorSet1[5] = colorCombine(0,255,0,0)
currentColorSet1[6] = colorCombine(0,0,255,0)
currentColorSet1[7] = colorCombine(0,0,0,255)

/*
currentColorSet1[4] = colorCombine(0,0,0,0)
currentColorSet1[5] = colorCombine(0,0,0,0)
currentColorSet1[6] = colorCombine(0,0,0,0)
currentColorSet1[7] = colorCombine(0,0,0,0)
*/
ws281x.render()
