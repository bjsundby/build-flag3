/* --- Dependencies ---------------------------------- */

var wpi = require("node-wiring-pi")
wpi.setup('gpio')

let spec = {
  address: 0x60,
  steppers: [{ W1: 'M1', W2: 'M2' }, { W1: 'M3', W2: 'M4' }]
};
var motorHat = require('motor-hat')(spec)
motorHat.init();
motorHat.steppers[0].setSteps(200);
motorHat.steppers[0].setSpeed({sps:180});
motorHat.steppers[1].setSteps(200);
motorHat.steppers[1].setSpeed({sps:180});

/* --- State variables ------------------------------- */

const stepRange = 200         // Number of steps for each separate motor run
var stepFactor = 162          // Factor for computing number of steps from %
var currentFlagPosition = 0   // Current flag position in steps
var topFlagPosition = 0       // Step count for top flag position
var nextFlagPosition = 0      // Flag position in steps
var flagStatus = 0            // 0=start cal bottom, 1=cal bottom, 2=start cal top, 3=cal top, 4=stopped, 5=moving

/* --- Setup subsystems ------------------------------- */

// Setup sensors for detecting flag at bottom
var bottomsensorpin = 24
var topsensorpin = 25
wpi.pinMode(bottomsensorpin, wpi.INPUT)
wpi.pinMode(topsensorpin, wpi.INPUT)


// Setup stepper motor for flag
const MODES = {
  SINGLE: [
    [ 1, 0, 0, 0 ],
    [ 0, 1, 0, 0 ],
    [ 0, 0, 1, 0 ],
    [ 0, 0, 0, 1 ]
  ],
  DUAL: [
    [ 1, 0, 0, 1 ],
    [ 0, 1, 0, 1 ],
    [ 0, 1, 1, 0 ],
    [ 1, 0, 1, 0 ]
  ]
};
const pins = [
  17, // A+
  27, // A-
  22, // B+
  23  // B-
];

/* --- Common functions ------------------------------- */

function readBottomPositionFlagSensor() {
  return wpi.digitalRead(bottomsensorpin)
}

function readTopPositionFlagSensor() {
  return wpi.digitalRead(topsensorpin)
}

function calibrateFlagBottom() {
  if (readBottomPositionFlagSensor() == 0) {
    console.log("calibrateFlagBottom, move down")
    motorHat.steppers[0].step('back', stepRange, (err, result) => {
      console.log("calibrateFlagBottom, move down")
      if (readBottomPositionFlagSensor() == 0) {
        calibrateFlagBottom();
      }
      else {
        console.log("calibrateFlagBottom, hit bottom")
        currentFlagPosition = 0
        flagStatus = 2
      }
    })
  }
  else {
    console.log("calibrateFlagBottom, is at bottom")
    currentFlagPosition = 0
    flagStatus = 2
  }
}

function calibrateFlagTop() {
  if (readTopPositionFlagSensor() == 0) {
    motorHat.steppers[0].step('back', -stepRange, (err, result) => {
      currentFlagPosition += stepRange
      if (readTopPositionFlagSensor() == 0) {
        calibrateFlagTop()
      }
      else {
        topFlagPosition = currentFlagPosition
        stepFactor = topFlagPosition / 100
        flagStatus = 4
      }
    })
  }
  else {
    topFlagPosition = currentFlagPosition
    stepFactor = topFlagPosition / 100
    flagStatus = 4
  }
}

function MoveFlagToPosition() {
  if (currentFlagPosition != nextFlagPosition) {
    var steps = (currentFlagPosition - nextFlagPosition);
    if (steps < 0) {
      if (steps < -stepRange) {
        steps = -stepRange
      }
      motorHat.steppers[0].step('back', steps, (err, result) => {
        currentFlagPosition -= steps;
        if (readTopPositionFlagSensor() == 0) {
          MoveFlagToPosition()
        }
        else {
          flagStatus = 4
          topFlagPosition = currentFlagPosition;
        }
      })
    } else if (steps > 0) {
      if (steps > stepRange) {
        steps = stepRange
      }
      motorHat.steppers[0].step('back', steps, (err, result) => {
        currentFlagPosition -= steps
        if (readBottomPositionFlagSensor() == 0) {
          MoveFlagToPosition()
        }
        else {
          flagStatus = 4;
          currentFlagPosition = 0
        }
      })
    }
  }
  else {
    flagStatus = 4
  }
}

/* --- Processing functions ---------------------------------- */

function processFlag() {
  try {
    console.log("processFlag, flagStatus: " + flagStatus)
    // Check for inital calibration
    if (flagStatus == 0) {
      flagStatus = 1
      calibrateFlagBottom()
    }

    if (flagStatus == 2) {
      flagStatus = 3
      calibrateFlagTop()
    }

    // Check for moving flag request
    if (flagStatus == 4 && (currentFlagPosition != nextFlagPosition)) {
      flagStatus = 5
      MoveFlagToPosition()
    }
  } catch (error) {
    console.log("Crashed in processFlag", error)
  }
}

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

// Main processing loop, runs 2Hz
/*
setInterval(function () {
 processFlag()
}, 500)

*/
console.log("Start motor 1")
motorHat.steppers[0].step('back', 200, (err, result) => {
})

console.log("Start motor 2")
motorHat.steppers[1].step('back', 200, (err, result) => {
})
