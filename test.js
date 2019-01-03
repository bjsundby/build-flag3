/* --- Dependencies ---------------------------------- */

var wpi = require("wiring-pi")
var Stepper = require('wpi-stepper').Stepper;

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
const mode = MODES.SINGLE;
const motor = new Stepper({ pins, mode, steps: 4096 });
motor.speed = 15;

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
    motor.move(stepRange).then(() =>  {
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
    motor.move(-stepRange, function () {
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
      motor.move(steps, function () {
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
      motor.move(steps, function () {
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
console.log("Start motor 10000")
motor.move(10000);
console.log("Start motor -10000")
motor.move(-10000);
console.log("Finished")
