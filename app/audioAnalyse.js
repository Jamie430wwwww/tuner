let songlist;
let volumelist;

const videoInput = document.getElementById('video-input');
const audioInput1 = document.getElementById('audio-input1');
const audioInput2 = document.getElementById('audio-input2');
const videoTag = document.getElementById('video-tag');
const audioTag1 = document.getElementById('audio-tag1');
const audioTag2 = document.getElementById('audio-tag2');
const startbutton = document.getElementById('start');
const BPMButton = document.getElementById('EnterBPM')

let playing=false;

let audioContext, analyser, source;
function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaElementSource(audioTag2);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);
}

async function getCurrentVolume() {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  analyser.getByteTimeDomainData(dataArray);

  // Calculate the volume
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
      sum += (dataArray[i] - 128) ** 2; // Normalize to get the amplitude
  }
  const average = sum / dataArray.length;
  const volume = Math.sqrt(average); // Root mean square

  return volume;
}


startbutton.addEventListener('click',()=>{
  if(playing==false){
    playing=true
    setupAudio()
    videoTag.volume = 0; // Optional: Mute video if desired
    videoTag.play(); // Play the video
    audioTag1.play(); // Play the audio
    audioTag1.volume=0
    audioTag2.play(); // Play the audio
    console.log(audioTag2.duration)
    pollFunc(UpdateSonglist, (audioTag2.duration*1000), (((60/123)/16)*1000));
    console.log(test)
  }
})

BPMButton.addEventListener('click',()=>{
  if(playing){

  }
})




videoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const objectURL = URL.createObjectURL(file);
        videoTag.src = objectURL;
        videoTag.load();
    }
});

audioInput1.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const objectURL = URL.createObjectURL(file);
        audioTag1.src = objectURL;
        audioTag1.load();
    }
});
audioInput2.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
      const objectURL = URL.createObjectURL(file);
      audioTag2.src = objectURL;
      audioTag2.load();
  }
});


// Function to get the current volume level of an audio track at the moment of the call
async function getAudioVolume(audioElement) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaElementSource(audioElement);

  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 256; // Size of the FFT

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  // Get volume level at the moment of the call
  function getVolume() {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    return average; // This is the approximate volume level
  }
  return await getVolume(); // Return the volume level immediately
}

const Tuner = function (a4) {
  this.middleA = a4 || 440;
  this.semitone = 69;
  this.bufferSize = 4096;
  this.noteStrings = [
    "C",
    "C♯",
    "D",
    "D♯",
    "E",
    "F",
    "F♯",
    "G",
    "G♯",
    "A",
    "A♯",
    "B",
  ];

  this.initGetUserMedia();
};

Tuner.prototype.initGetUserMedia = function () {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!window.AudioContext) {
    return alert("AudioContext not supported");
  }

  // Older browsers might not implement mediaDevices at all, so we set an empty object first
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      const getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        alert("getUserMedia is not implemented in this browser");
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
};

function pollFunc(fn, timeout, interval) {
  var startTime = (new Date()).getTime();
  interval = interval || 1000;

  (function p() {
      fn();
      if (((new Date).getTime() - startTime ) <= timeout)  {
          setTimeout(p, interval);
      }
  })();
}


let test;
Tuner.prototype.startRecord = function () {
  songlist = new Array(0);
  volumelist =new Array(0);

  const self = this;
  navigator.mediaDevices
    .getDisplayMedia({ audio: true })
    .then(function (stream) {
      // Check if the stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        alert("No audio track found in the selected screen. Please select a screen or window with audio.");
        return;
      }

      self.audioContext.createMediaStreamSource(stream).connect(self.analyser);
      self.analyser.connect(self.scriptProcessor);
      self.scriptProcessor.connect(self.audioContext.destination);
      self.scriptProcessor.addEventListener("audioprocess", function (event) {
        const frequency = self.pitchDetector.do(
          event.inputBuffer.getChannelData(0)
        );
        if (frequency && self.onNoteDetected) {
          const note = self.getNote(frequency);
          self.onNoteDetected({
            name: self.noteStrings[note % 12],
            value: note,
            cents: self.getCents(frequency, note),
            octave: parseInt(note / 12) - 1,
            frequency: frequency,
          });
          test = self.noteStrings[note % 12]+(parseInt(note / 12) - 1)
        }
      });
    })
    .catch(function (error) {
      alert(error.name + ": " + error.message);
    });
};

async function UpdateSonglist(){
  console.log(test)
  songlist.push(test)
  console.log(await getCurrentVolume())
  volumelist.push(await getCurrentVolume())
}

Tuner.prototype.init = function () {
  this.audioContext = new window.AudioContext();
  this.analyser = this.audioContext.createAnalyser();
  this.scriptProcessor = this.audioContext.createScriptProcessor(
    this.bufferSize,
    1,
    1
  );

  const self = this;

  aubio().then(function (aubio) {
    self.pitchDetector = new aubio.Pitch(
      "default",
      self.bufferSize,
      1,
      self.audioContext.sampleRate
    );
    self.startRecord();
  });
};

/**
 * get musical note from frequency
 *
 * @param {number} frequency
 * @returns {number}
 */
Tuner.prototype.getNote = function (frequency) {
  const note = 12 * (Math.log(frequency / this.middleA) / Math.log(2));
  return Math.round(note) + this.semitone;
};

/**
 * get the musical note's standard frequency
 *
 * @param note
 * @returns {number}
 */
Tuner.prototype.getStandardFrequency = function (note) {
  return this.middleA * Math.pow(2, (note - this.semitone) / 12);
};

/**
 * get cents difference between given frequency and musical note's standard frequency
 *
 * @param {number} frequency
 * @param {number} note
 * @returns {number}
 */
Tuner.prototype.getCents = function (frequency, note) {
  return Math.floor(
    (1200 * Math.log(frequency / this.getStandardFrequency(note))) / Math.log(2)
  );
};

/**
 * play the musical note
 *
 * @param {number} frequency
 */
Tuner.prototype.play = function (frequency) {
  if (!this.oscillator) {
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.connect(this.audioContext.destination);
    this.oscillator.start();
  }
  this.oscillator.frequency.value = frequency;
};

Tuner.prototype.stopOscillator = function () {
  if (this.oscillator) {
    this.oscillator.stop();
    this.oscillator = null;
  }
};


/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}
