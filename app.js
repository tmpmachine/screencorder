let chunks = [];

let app = (function() {
  
  let $$ = document.querySelectorAll.bind(document);
  
  let SELF = {
    StartCapture,
    TogglePause,
    PreviewRecord,
    GetData,
    ResumeRecording,
    PauseRecording,
    ToggleRecordAuto,
    PreviewPaused,
    RenameLastRecord,
    DownloadAll,
    FinalizeRecord,
    DownloadAll,
  };
  
  let fileCounter = 1;
  
  function DownloadAll() {
    for (let el of $$('#recording-list-final [data-id]')) {
      el.querySelector('[data-callback="download"]').click();
    }
  }
  
  function FinalizeRecord(id) {
    let finalRecordEl = $(`#recording-list [data-id="${id}"]`);
    finalRecordEl.querySelector('[data-slot="title"]').textContent = fileCounter;
    let finalContainer = $('#recording-list-final');
    finalContainer.append(finalRecordEl)
    
    fileCounter += 1;
  }
  
  function RenameLastRecord() {
    let finalRecordEl = Array.from(document.querySelectorAll(`#recording-list [data-id]`)).pop();
    finalRecordEl.querySelector('[data-slot="title"]').textContent = fileCounter;
    
    let finalContainer = $('#recording-list-final');
    finalContainer.append(finalRecordEl)
    
    fileCounter += 1;
    let notif = new Notification('Renamed');
    setTimeout(() => {
      notif.close();
    }, 1000);
  }
  
  function PreviewPaused() {
    if (window.mediaRecorder.state != 'paused') return;
    
    let blob = new Blob(chunks, { type: "video/webm" });
    let data = URL.createObjectURL(blob);
    
    let el = document.createElement('a');
    el.href = data;
    el.target = '_blank';
    el.onclick = function() {
      el.remove();
    };
    document.body.append(el);
    el.click();
  }
  
  function ToggleRecordAuto() {
    if (stream && window.mediaRecorder && (window.mediaRecorder.state == 'recording' || window.mediaRecorder.state == 'paused')) {
      stopRecording()
    } else {
      if (stream) {
        initCapture()
      } else {
        app.StartCapture();
      }
    }
  }

  
  function ResumeRecording() {
    window.mediaRecorder.resume()
    document.title = 'Recording'
  }
  
  function PauseRecording() {
    window.mediaRecorder.pause()
    document.title = 'Paused'
  }
  
  function GetData(id) {
    return recordingData.find(x => x.id == id);
  }
  
  function PreviewRecord(id) {
    let data = getData(id);
    
    let el = document.createElement('a');
    el.href = data.url;
    el.target = '_blank';
    el.onclick = function() {
      el.remove();
    };
    document.body.append(el);
    el.click();
    
  }
  
  function TogglePause() {
    if (window.mediaRecorder.state == 'paused') {
      window.mediaRecorder.resume()
      document.title = 'Recording'
    } else if (window.mediaRecorder.state == 'recording') {
      window.mediaRecorder.pause()
      document.title = 'Paused'
    }
  }
  
  async function StartCapture() {
    
    let displayMediaOptions = {
      video: {
        // displaySurface: "window",
        // sampleRate: 60,
        // width: 1280,
        // height: 720,
        width: 1366,
        height: 768,
        // width: 640,
        // height: 360,
        // width: 854,
        // height: 480,
        // width: 1920,
        // height: 1080 ,
        frameRate: 60,
        displaySurface: 'monitor',
        logicalSurface: true
      },
      // video: true,
      // audio: true,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        sampleRate: 44100,
        // suppressLocalAudioPlayback: true
      },
      // surfaceSwitching: "include",
      // selfBrowserSurface: "exclude",
      // systemAudio: "exclude"
    }
    
    try {
      if (stream) {
        stream.getTracks().forEach(x => x.stop());
      }
      stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      // merge mic audio stream
      if ($('#in-check-record-mic').checked) {
        let micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
        });
        stream = mergeStream(stream, micStream);
      }
      
    } catch (err) {
      console.error(`Error: ${err}`);
    }
      
    // initCapture();
    
  }
    
  function mergeStream(screenStream, micStream) {
    
    let mixedStream = new MediaStream([...screenStream.getVideoTracks(), ...micStream.getAudioTracks()]);
    
    if (screenStream.getAudioTracks().length > 0) {
      
      let ac = new AudioContext();
      let node1 = ac.createMediaStreamSource(screenStream);
      let node2 = ac.createMediaStreamSource(micStream);
      let destStream = ac.createMediaStreamDestination();
      node1.connect(destStream);
      node2.connect(destStream);
      let mixedAudioStream = destStream.stream;
    
      let mixedStream = new MediaStream([...screenStream.getVideoTracks(), ...mixedAudioStream.getAudioTracks()]);
    
    }
    
    return mixedStream;
  }
  
  return SELF;
  
})();


function stopRecording() {
  window.mediaRecorder.stop();
  document.title = 'stopped';
}

let stream;
let isCapture = false;



let DOMEvents = (function() {
    
  let eventsMap = {
  	clickable: {
  		'recording-list-handler': (evt) => recordingListHandler(evt),
  	},
    onclick: {
    	'start-capture': () => app.StartCapture(),
  		'download-all': () => app.DownloadAll(),
    },
  };
  
  let listenOn=function(e,t,l){for(let n of document.querySelectorAll(e))n.addEventListener(t,l[n.dataset.callback])};
    
  let listening = function(selector, dataKey, eventType, callbacks) {
    let elements = document.querySelectorAll(selector);
    for (let el of elements) {
      let callbackFunc = callbacks[el.dataset[dataKey]];
      el.addEventListener(eventType, callbackFunc);
    }
  };
  
  function Init() {
    listening('[data-onclick]', 'onclick', 'click', eventsMap.onclick);
    listenOn('.clickable', 'click', eventsMap.clickable);
  }
  
  return {
    Init,
  };

})();



function recordingListHandler(evt) {
  if (!evt.target.dataset.callback) return;
  
  let recordingEl = evt.target.closest('.i-item');
  let id = recordingEl.dataset.id;
  switch (evt.target.dataset.callback) {
    case 'delete': deleteRecord(id); break;
    case 'rename': renameRecord(id); break;
    case 'finalize': app.FinalizeRecord(id); break;
    case 'download': downloadRecord(recordingEl, id); break;
    case 'preview': app.PreviewRecord(id); break;
  }
}

function renameRecord(id) {
  let data = getData(id);
  let title = window.prompt('title', data.title);
  if (!title) return;
  
  data.title = title;
  $(`#recording-list [data-id="${id}"] [data-slot="title"]`).textContent = title;
}



function downloadRecord(recordingEl, id) {
  let data = getData(id);
  
  let fileNameNoExt = recordingEl.querySelector('[data-slot="title"]').textContent;
  
  // setEndTime();
  let el = document.createElement('a');
  el.href = data.url;
  el.download = `${fileNameNoExt}.webm`;
  el.onclick = function() {
    el.remove();
  };
  document.body.append(el);
  el.click();
}

function deleteRecord(id) {
  let data = getData(id);
  
  $(`#recording-list [data-id="${id}"]`).remove();
}


function getData(id) {
  return app.GetData(id);
}




function initCapture() {
  if (!navigator.mediaDevices)
    console.log("getUserMedia not supported.");


  const constraints = { audio: true };

  
  window.mediaRecorder = new MediaRecorder(stream);
  isCapture = true;

    mediaRecorder.start();
    document.title = 'Recording'
    
    mediaRecorder.onstop = async (e) => {
      isCapture = false;
      console.log("data available after MediaRecorder.stop() called.");

      const clipName = 'untitled';

      // const clipContainer = document.createElement("article");
      // const clipLabel = document.createElement("p");
      // const audio = document.createElement("video");
      // const deleteButton = document.createElement("button");

      // clipContainer.classList.add("clip");
      // audio.setAttribute("controls", "");
      // deleteButton.textContent = "Delete";
      // clipLabel.textContent = clipName;

      // clipContainer.appendChild(audio);
      // clipContainer.appendChild(clipLabel);
      // clipContainer.appendChild(deleteButton);
      // document.body.appendChild(clipContainer);

      // audio.controls = true;
      const blob = new Blob(chunks, { type: "video/webm" });
      chunks = [];
      const audioURL = URL.createObjectURL(blob);
      // window.downloadUrl = audioURL;
      // audio.src = audioURL;
      // console.log("recorder stopped");

      // deleteButton.onclick = (e) => {
      //   const evtTgt = e.target;
      //   evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      //   URL.revokeObjectURL(audioURL)
      // };
      
      // Wait for video element to be ready
      // audio.addEventListener('loadedmetadata', async () => {
        // const videoDuration = videoElement.duration;
        // Use the video duration
        // audio.currentTime = 99999999;
        // await new Promise(resolve => window.setTimeout(resolve, 1000));
        // await getCaptureBlob(audio.captureStream(), audio)
      // });
      
      // stop stream to save power`
      // stream.getTracks().forEach(x => x.stop());
      
      let data = {
        id: generateRandomId(),
        title: clipName,
        url: audioURL,
      }
      recordingData.push(data);
      appendRecordingEl(data);
              
    };
    
    
    mediaRecorder.onpause = (e) => {
      // do something in response to
      // recording being paused
      // console.log(e)
      e.target.requestData();
    };

    mediaRecorder.ondataavailable = (e) => {
      // console.log(e.data)
      // console.log(chunks)
      chunks.push(e.data);
    };
}
  
function generateRandomId() {
  const randomString = Math.random().toString(36).substring(2, 8);
  const timestamp = Date.now().toString(36).substring(4, 10);
  return `${randomString}-${timestamp}`;
}



window.$ = document.querySelector.bind(document);

  let recordingData = [];
  
  function appendRecordingEl(data) {
    let docFrag = document.createDocumentFragment()
    let el = window.templateSlot.fill({
      data, 
      template: document.querySelector('#tmp-list-posts').content.cloneNode(true), 
      modifier: (el, data) => {
        el.querySelectorAll('.i-item')[0].dataset.id = data.id;
    // 	if (data.name.first == 'Jhon') {
    		// do something 
    		// el.querySelectorAll('.container')[0].style.background = 'lightblue';
    // 	}
      },
    });
    
    docFrag.append(el);
    $('#recording-list').append(docFrag);
  }


  function generateUID() {
    let firstPart = (Math.random() * 46656) | 0;
    let secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
  }


  function download() {
    setEndTime();
    let el = document.createElement('a');
    let url = window.downloadUrl;
    el.href = url;
    el.download = generateUID() + '.webm';
    el.onclick = function() {
      el.remove();
    };
    document.body.append(el);
    el.click();
  }
  
  function setEndTime() {
    document.querySelector('video').currentTime = 99999999;
  }


  function OnePress() {
    
    let pressed = {}
    
    function watch(type, key) {
      if (type == 'keydown') {
        if (pressed[key]) {
          
        } else {
          pressed[key] = true
          return true
        }
      } else {
        pressed[key] = false;
      }
      
      return false
    }
    
    function blur() {
      pressed = {};
    }
    
    return {
      watch,
      blur,
    };
    
  }
  
  let onePress = OnePress();

  function initGamepad() {
    gameControl.on('connect', function(gamepad) {
      
      let timer1 = 0;
      let timer2 = 0;
      let timer3 = 0;
      let timer4 = 0;
      
      gamepad.on('button0', () => {
        if (onePress.watch('keydown', 'button0')) {
          toggleRecord();
        }
      }).after('button0', () => {
        onePress.watch('keyup', 'button0');
      });
      
    });
    
  }
  
  let i = 0;
  function toggleRecord() {
    // signalingtext.textContent += i+','
    // i++
    if (isCapture)
      stopRecording();
    else
      app.StartCapture();
  }
  
  initGamepad()
  
  window.addEventListener('keydown', keyHandler)
  window.addEventListener('keyup', keyHandler)
  window.addEventListener('blur', blurHandler)
 
 function blurHandler() {
  // onePress.watch('keyup', 'R')
  // onePress.watch('keyup', 'T')
 }
 
 function keyHandler(e) {
  // if (e.key == 'r') {
  //   if (onePress.watch(e.type, 'R')) {
  //     toggleRecord()
  //   }
  // } else if (e.key == 't') {
  //   if (onePress.watch(e.type, 'T')) {
  //     initCapture()
  //   }
  // }
 }
 
 async function getCaptureBlob(stream, videoElement) {
   
  // const videoElement = document.querySelector('video');
    const videoDuration = videoElement.duration;
    
    // Create ImageCapture object from video track
    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    
    
    try {
      let imageBitmap = await imageCapture.grabFrame(videoDuration / 2);
      // Use the blob data
      const options = {
        type: 'image/png', // specify the MIME type of the blob
        quality: 1 // specify the quality of the blob (for image types only)
      };
      // Create a new canvas element with the same dimensions as the imageBitmap
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      
      // Draw the imageBitmap onto the canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0);
      
      ctx.canvas.toBlob(blob => {
        downloadBlob(blob)
      })
      
    } catch (error) {
      console.error('Error grabbing frame:', error);
    }
      // Use the blob data
    
    function downloadBlob(theBlob) {
      let el = document.createElement('a');
      let url = URL.createObjectURL(theBlob)
      el.href = url;
      el.download = 'download.json';
      el.onclick = function() {
        el.remove();
      };
      document.body.append(el);
      el.click();
    }
   
 }
 
  
 
// midi detector
// ================

// Request access to MIDI devices
navigator.requestMIDIAccess()
  .then(onMIDISuccess, onMIDIFailure);

// MIDI success callback
function onMIDISuccess(midiAccess) {
  // Get the first available MIDI input device
  const inputs = midiAccess.inputs.values();
  for (let input of inputs) {
    // Set up a listener for MIDI messages
    input.onmidimessage = onMIDIMessage;
    // input.onstatechange = onMIDIStateChange;
  }
}

// MIDI failure callback
function onMIDIFailure(error) {
  console.log('Failed to access MIDI devices:', error);
}


// MIDI state change callback
function onMIDIStateChange(event) {
  // const { port, port.state } = event;
  // console.log('MIDI device state changed:', port.name, port.state);
  // You can perform actions based on the MIDI device state change
}

window.instantSwapmode = false;

// MIDI message callback
function onMIDIMessage(event) {
  const { data } = event;
  
  // 144 = pressed
  
  if (data[0] != 144) return;
  
  // console.log(data[1])
  if (data[1] == 60) {
    app.ToggleRecordAuto()
  } else if (data[1] == 65) {
    app.TogglePause()
  } else if (data[1] == 72) { // C top
    app.PreviewPaused();
  } else if (data[1] == 77) { // F top
    app.RenameLastRecord();
  } else if (data[1] == 84) { // last note
    app.DownloadAll();
  }
  
  // // if (window.mediaRecorder.state == 'paused') {
  //   if (data[2] === 0) {
  //     instantSwapmode = true;
  //     // window.mediaRecorder.resume()
  //   }
  // // } else if (window.mediaRecorder.state == 'recording') {
  //   else if (data[2] > 0) {
  //     instantSwapmode = false;
  //     // window.mediaRecorder.pause()
  //   }
  // }
  
  // Process the MIDI message
  // console.log('Received MIDI message:', data);
  // You can perform specific actions based on the MIDI data received
}




// window.liston = window.addEventListener('visibilitychange',()=>{
//   if (isCapture && instantSwapmode) {
    
//     if (window.mediaRecorder.state == 'paused') {
//       window.setTimeout(() => {
//         window.mediaRecorder.resume()
//       }, 300)
//     } else if (window.mediaRecorder.state == 'recording') {
//       window.mediaRecorder.pause()
//     }
    
//   }
// })

DOMEvents.Init();