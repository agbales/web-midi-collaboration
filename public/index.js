var socket = io();
// var above replacing commented out below
// var socket = io.connect('http://localhost:8080');
socket.on('midi', gotExternalMidiMessage);


// Midi handling
var midi, data;
// start talking to MIDI controller
if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess({
    sysex: false
  }).then(onMIDISuccess, onMIDIFailure);
} else {
  console.warn("No MIDI support in your browser")
}

// on success
function onMIDISuccess(midiData) {
  // this is all our MIDI data
  midi = midiData;
  var allInputs = midi.inputs.values();
  // loop over all available inputs and listen for any MIDI input
  for (var input = allInputs.next(); input && !input.done; input = allInputs.next()) {
    // when a MIDI value is received call the onMIDIMessage function
    input.value.onmidimessage = gotMIDImessage;
  }
}

var dataList = document.querySelector('#midi-data ul');

function gotMIDImessage(messageData) {
  console.log('got user midi message');

  // emit message to server for other connections to use
  var d = messageData.data;
  var data = {
    on: d[0],
    pitch: d[1],
    velocity: d[2]
  }
  socket.emit('midi', data);

  // render data in window
  var newItem = document.createElement('li');
  newItem.appendChild(document.createTextNode(messageData.data));
  newItem.className = "user-midi";
  dataList.appendChild(newItem);
}

function gotExternalMidiMessage(data) {
  console.log('got external midi message');
  console.log('external data: ' + data);
  // render data in window
  var newItem = document.createElement('li');
  newItem.appendChild(document.createTextNode(data.on + ',' + data.pitch + ',' + data.velocity));
  newItem.className = "external-midi";
  dataList.appendChild(newItem);
}

// on failure
function onMIDIFailure() {
  console.warn("Not recognising MIDI controller");
}
