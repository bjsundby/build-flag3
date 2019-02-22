import 'whatwg-fetch';

const options = {
  credentials: 'same-origin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

export function getStatus() {
  return fetch('/getStatus', options)
    .then(response => response.json());
}

export function setFlagPosition(position) {
  var url = '/setflag/' + position;
  return fetch(url, options)
    .then(response => response.json());
}

export function setTopLedFunction(ledFunction) {
  var url = '/setrgbled/function/' + ledFunction;
  return fetch(url, options)
    .then(response => response.json());
}

export function setBottomLedFunction(ledFunction) {
  var url = '/setneopixel/function/' + ledFunction;
  return fetch(url, options)
    .then(response => response.json());
}

export function setRotateTopLed(on) {
  var url = '/setrotateled/' + on;
  return fetch(url, options)
    .then(response => response.json());
}
