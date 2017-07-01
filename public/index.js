(function(window, document, undefined) {
  var socket = io();
  socket.on('externalMidi', gotExternalMidiMessage);

  // for midi oscillator playback
  var context = new AudioContext();
  var oscillators = {};
  var midi, data;

  function frequency(note) {
      return Math.pow(2, ((note - 69) / 12)) * 440;
  }

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
    if (messageData.data[0] == 144) {
      var newItem = document.createElement('li');
      newItem.appendChild(document.createTextNode('Note: ' + messageData.data[1] + '   Velocity: ' + messageData.data[2] + '   Frequency: ' + frequency(d[1]).toFixed(1)));
      newItem.className = "user-midi";
      document.getElementById('midi-data').prepend(newItem);
    }
    // pass singal to player
    playNote(data);
  }

  function gotExternalMidiMessage(data) {
    console.log('got external midi message');
    console.log('external data: ' + data);
    // render data in window
    var newItem = document.createElement('li');
    newItem.appendChild(document.createTextNode('Note: ' + messageData.data[1] + '   Velocity: ' + messageData.data[2] + '   Frequency: ' + frequency(d[1]).toFixed(1)));
    newItem.className = "external-midi";
    document.getElementById('midi-data').prepend(newItem);

    playNote(data);
    updateView(data);
  }

  // midi note player
  function playNote(data){
    switch(data.on) {
      case 144:
        noteOn(frequency(data.pitch), data.velocity);
        break;
      case 128:
        noteOff(frequency(data.pitch), data.velocity);
        break;
    }

    function noteOn(frequency, velocity) {
      var vol = (velocity / 127).toFixed(2);

      var osc = oscillators[frequency] = context.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = frequency;
          osc.setVolume = vol;
          osc.connect(context.destination);
          osc.start(context.currentTime);
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



  // Midi keyboard setup and styling
 var notes, currentInput;

 function onMidiMessage(msg) {
   var action = isNoteOffMessage(msg) ? 'remove' :
                  (isNoteOnMessage(msg) ? 'add' : null),
       noteDiv;
   if(action && (noteDiv = getNoteDiv(msg))) {
     noteDiv.classList[action]('piano-key-pressed');
   }
   // we'll also want to handle external midi input with 'piano-key-pressed'
 }

 const MIDI_A0_NUM = 45;

 function getNoteDiv(msg) {
   var noteNum = getMessageNote(msg) - MIDI_A0_NUM;

   if(notes && 0 <= noteNum && noteNum < notes.length) {
     return notes[noteNum];
   }
 }

 const CMD_NOTE_ON = 9;
 const CMD_NOTE_OFF = 8;

 function isNoteOnMessage(msg) {
   return getMessageCommand(msg) == CMD_NOTE_ON;
 }

 function isNoteOffMessage(msg) {
   var cmd = getMessageCommand(msg);
   return cmd == CMD_NOTE_OFF ||
     (cmd == CMD_NOTE_ON && getMessageVelocity(msg) == 0);
 }

 function getMessageCommand(msg) { return msg.data[0] >> 4; }
 function getMessageNote(msg) { return msg.data[1]; }
 function getMessageVelocity(msg) { return msg.data[2]; }

 function selectInput(input) {
   if(input != currentInput) {
     if(currentInput) {
       currentInput.removeEventListener('midimessage', onMidiMessage);
       currentInput.close();
     }

     input.addEventListener('midimessage', onMidiMessage);
     currentInput = input;
   }
 }

 function populateInputList() {
   var inputs = Array.from(midi.inputs.values());

   if(inputs.length == 1) {
     selectInput(inputs[0]);
   } else {
     // TODO: handle multiple MIDI inputs
   }
 }

 function onMIDIAccessSuccess(access) {
   midi = access;
   access.addEventListener('statechange', populateInputList, false);
   populateInputList();
 }

 function onMIDIAccessFail() {
   console.error('Request for MIDI access was denied!');
 }

 if('requestMIDIAccess' in window.navigator) {
   window.navigator
     .requestMIDIAccess()
     .then(onMIDIAccessSuccess, onMIDIAccessFail);
 } else {
   console.error('Your device doesn\' support WebMIDI or its polyfill');
 }

 document.addEventListener('DOMContentLoaded', function() {
   notes = document.getElementsByClassName('piano-key');
 }, false);

 //extrnal midi will trigger this
 function updateView(msg) {
     var action = isNoteOffMessage(msg) ? 'remove' :
                  (isNoteOnMessage(msg) ? 'add' : null),
         noteDiv;
     if(action && (noteDiv = getNoteDiv(msg))) {
       noteDiv.classList[action]('piano-key-pressed-external');
     }
 }

})(window, window.document);
