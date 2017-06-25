var socket = io();
// var above replacing commented out below
// var socket = io.connect('http://localhost:8080');
socket.on('externalMidi', gotExternalMidiMessage);

// for midi oscillator playback
var context = new AudioContext();
var oscillators = {};


// conversion
function frequency(note) {
    return Math.pow(2, ((note - 69) / 12)) * 440;
}

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
  console.log(midiData);
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
  newItem.appendChild(document.createTextNode(messageData.data + ' frequency: ' + frequency(d[1]).toFixed(1)));
  newItem.className = "user-midi";
  dataList.prepend(newItem);

  playNote(data);
}

function gotExternalMidiMessage(data) {
  console.log('got external midi message');
  console.log('external data: ' + data);
  // render data in window
  var newItem = document.createElement('li');
  newItem.appendChild(document.createTextNode(data.on + ',' + data.pitch + ',' + data.velocity));
  newItem.className = "external-midi";
  dataList.prepend(newItem);

  playNote(data);
}

// midi note player
function playNote(data){
  switch(data.on) {
    case 144:
      noteOn(frequency(data.pitch), data.velocity);
      console.log('note on');
      break;
    case 128:
      noteOff(frequency(data.pitch), data.velocity);
      console.log('note off');
      break;
  }

  function noteOn(frequency, velocity) {
    oscillators[frequency] = context.createOscillator();
    oscillators[frequency].frequency.value = frequency;
    oscillators[frequency].connect(context.destination);
    oscillators[frequency].start(context.currentTime);
  }

  function noteOff(frequency, velocity) {
      oscillators[frequency].stop(context.currentTime);
      oscillators[frequency].disconnect();
  }
}

// on failure
function onMIDIFailure() {
  console.warn("Not recognising MIDI controller");
}
