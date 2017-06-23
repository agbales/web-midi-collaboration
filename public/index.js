var socket;
socket = io.connect('http://localhost:3000');

// Midi stuff
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

  // send via socket
  var d = messageData.data;
  var data = {
    on: d[0],
    pitch: d[1],
    velocity: d[2]
  }
  socket.emit('midi', data);

  // render info in window
  var newItem = document.createElement('li');
  newItem.appendChild(document.createTextNode(messageData.data));
  dataList.appendChild(newItem);
}

// on failure
function onMIDIFailure() {
  console.warn("Not recognising MIDI controller");
}
