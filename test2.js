
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

// 0xwwbbggrr
currentColorSet1[4] = 0x000000ff
currentColorSet1[5] = 0x0000ff00
currentColorSet1[6] = 0x00ff0000
currentColorSet1[7] = 0xff000000

ws281x.render()
