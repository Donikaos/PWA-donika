/*const container = document.querySelector(".container");
const coffees = [
  {
    name: "Perspiciatis",
    image: "images/coffee1.jpg"
  },
  {
    name: "Voluptatem",
    image: "images/coffee2.jpg"
  },
  {
    name: "Explicabo",
    image: "images/coffee3.jpg"
  },
  {
    name: "Rchitecto",
    image: "images/coffee4.jpg"
  },
  {
    name: " Beatae",
    image: "images/coffee5.jpg"
  },
  {
    name: " Vitae",
    image: "images/coffee6.jpg"
  },
  {
    name: "Inventore",
    image: "images/coffee7.jpg"
  },
  {
    name: "Veritatis",
    image: "images/coffee8.jpg"
  },
  {
    name: "Accusantium",
    image: "images/coffee9.jpg"
  }
];
const showCoffees = () => {
  let output = "";
  coffees.forEach(
    ({ name, image }) =>
      (output += `
              <div class="card">
                <img class="card--avatar" src=${image} />
                <h1 class="card--title">${name}</h1>
                <a class="card--link" href="#">Taste</a>
              </div>
              `)
  );
  container.innerHTML = output;
};

document.addEventListener("DOMContentLoaded", showCoffees);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err));
  });
} */

var theStream;
var theRecorder;
var recordedChunks = [];

// This function initializes user media
function getUserMedia(options, successCallback, failureCallback) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(options)
      .then(successCallback)
      .catch(failureCallback);
  }
  throw new Error('User Media API not supported.');
}


// This function is called to start the media stream and recording
function getStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('User Media API not supported.');
    return;
  }

  var constraints = { video: true, audio: true };
  getUserMedia(constraints, function (stream) {
    var mediaControl = document.querySelector('video');
    
    // Older browsers may not have srcObject
    if ("srcObject" in mediaControl) {
      mediaControl.srcObject = stream;
    } else {
      // Avoid using this in new browsers, as it is going away.
      mediaControl.src = window.URL.createObjectURL(stream);
    }
    
    theStream = stream;
    setupRecorder(stream); // This is a new function to encapsulate the recorder setup
  }, function (err) {
    alert('Error: ' + err);
  });
}
function setupRecorder(stream) {
  try {
    theRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    theRecorder.ondataavailable = function(event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    theRecorder.start(100); // Collect 100ms of data chunks
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    return;
  }
  console.log('MediaRecorder created');
}

// This new function retrieves the video from the cache and downloads it.
async function downloadFromCache() {
  const videoKey = 'my_recorded_video.webm';  // This should match the key used when saving the video.

  if (!('caches' in window)) {
    alert('Cache API not supported!');
    return;
  }

  try {
    const cache = await caches.open('video-cache');
    const cachedResponse = await cache.match(videoKey);
    
    if (!cachedResponse || !cachedResponse.ok) {
      throw new Error('No cached video found!');
    }

    const blob = await cachedResponse.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'downloaded_video.webm';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Failed to download video from cache:', err);
    alert(`Error: ${err.message}`);
  }
}



// Stops the recording and saves the video to cache
function stopRecordingAndSaveToCache() {
  console.log('Stopping recording and saving data');
  theRecorder.stop();
  theStream.getTracks().forEach(track => track.stop());

  theRecorder.onstop = function() {
    // Create a Blob from the recorded chunks
    var blob = new Blob(recordedChunks, { type: 'video/webm' });
    saveToCache(blob);
  };
}

// Saves the recording Blob to the cache
function saveToCache(blob) {
  if ('caches' in window) {
    const videoKey = 'my_recorded_video.webm';
    const request = new Request(videoKey, { mode: 'no-cors' });
    const response = new Response(blob);

    caches.open('video-cache').then(cache => {
      cache.put(request, response).then(() => {
        console.log('Saved video to cache.');
      }).catch(error => {
        console.error('Failed to save video to cache:', error);
      });
    });
  } else {
    console.error('Cache API not supported');
  }
}

var target = document.getElementById('target');
var watchId;

function appendLocation(location, verb) {
  verb = verb || 'updated';
  var newLocation = document.createElement('p');
  newLocation.innerHTML = 'Location ' + verb + ': ' + location.coords.latitude + ', ' + location.coords.longitude + '';
  target.appendChild(newLocation);
}

if ('geolocation' in navigator) {
  document.getElementById('askButton').addEventListener('click', function () {
    navigator.geolocation.getCurrentPosition(function (location) {
      appendLocation(location, 'fetched');
    });
    watchId = navigator.geolocation.watchPosition(appendLocation);
  });
} else {
  target.innerText = 'Geolocation API not supported.';
}
if ('LinearAccelerationSensor' in window && 'Gyroscope' in window) {
  document.getElementById('moApi').innerHTML = 'Generic Sensor API';
  
  let lastReadingTimestamp;
  let accelerometer = new LinearAccelerationSensor();
  accelerometer.addEventListener('reading', e => {
    if (lastReadingTimestamp) {
      intervalHandler(Math.round(accelerometer.timestamp - lastReadingTimestamp));
    }
    lastReadingTimestamp = accelerometer.timestamp
    accelerationHandler(accelerometer, 'moAccel');
  });
  accelerometer.start();
  
  if ('GravitySensor' in window) {
    let gravity = new GravitySensor();
    gravity.addEventListener('reading', e => accelerationHandler(gravity, 'moAccelGrav'));
    gravity.start();
  }
  
  let gyroscope = new Gyroscope();
  gyroscope.addEventListener('reading', e => rotationHandler({
    alpha: gyroscope.x,
    beta: gyroscope.y,
    gamma: gyroscope.z
  }));
  gyroscope.start();
  
} else if ('DeviceMotionEvent' in window) {
  document.getElementById('moApi').innerHTML = 'Device Motion API';
  
  var onDeviceMotion = function (eventData) {
    accelerationHandler(eventData.acceleration, 'moAccel');
    accelerationHandler(eventData.accelerationIncludingGravity, 'moAccelGrav');
    rotationHandler(eventData.rotationRate);
    intervalHandler(eventData.interval);
  }
  
  window.addEventListener('devicemotion', onDeviceMotion, false);
} else {
  document.getElementById('moApi').innerHTML = 'No Accelerometer & Gyroscope API available';
}

function accelerationHandler(acceleration, targetId) {
  var info, xyz = "[X, Y, Z]";

  info = xyz.replace("X", acceleration.x && acceleration.x.toFixed(3));
  info = info.replace("Y", acceleration.y && acceleration.y.toFixed(3));
  info = info.replace("Z", acceleration.z && acceleration.z.toFixed(3));
  document.getElementById(targetId).innerHTML = info;
}

function rotationHandler(rotation) {
  var info, xyz = "[X, Y, Z]";

  info = xyz.replace("X", rotation.alpha && rotation.alpha.toFixed(3));
  info = info.replace("Y", rotation.beta && rotation.beta.toFixed(3));
  info = info.replace("Z", rotation.gamma && rotation.gamma.toFixed(3));
  document.getElementById("moRotation").innerHTML = info;
}

function intervalHandler(interval) {
  document.getElementById("moInterval").innerHTML = interval;
}
if ('localStorage' in window || 'sessionStorage' in window) {
  var selectedEngine;

  var logTarget = document.getElementById('target');
  var valueInput = document.getElementById('value');

  var reloadInputValue = function () {
  console.log(selectedEngine, window[selectedEngine].getItem('myKey'))
    valueInput.value = window[selectedEngine].getItem('myKey') || '';
  }
  
  var selectEngine = function (engine) {
    selectedEngine = engine;
    reloadInputValue();
  };

  function handleChange(change) {
    var timeBadge = new Date().toTimeString().split(' ')[0];
    var newState = document.createElement('p');
    newState.innerHTML = '' + timeBadge + ' ' + change + '.';
    logTarget.appendChild(newState);
  }

  var radios = document.querySelectorAll('#selectEngine input');
  for (var i = 0; i < radios.length; ++i) {
    radios[i].addEventListener('change', function () {
      selectEngine(this.value)
    });
  }
  
  selectEngine('localStorage');

  valueInput.addEventListener('keyup', function () {
    window[selectedEngine].setItem('myKey', this.value);
  });

  var onStorageChanged = function (change) {
    var engine = change.storageArea === window.localStorage ? 'localStorage' : 'sessionStorage';
    handleChange('External change in ' + engine + ': key ' + change.key + ' changed from ' + change.oldValue + ' to ' + change.newValue + '');
    if (engine === selectedEngine) {
      reloadInputValue();
    }
  }

  window.addEventListener('storage', onStorageChanged);
 }

const target = document.getElementById('target');
  target.innerHTML = 'Opening file handle...';
  
  const handle = await window.chooseFileSystemEntries({
    type: 'save-file',
  });
  
  const file = await handle.getFile()
  const writer = await handle.createWriter();
  await writer.write(0, 'Hello world from What Web Can Do!');
  await writer.close()
  
  target.innerHTML = 'Test content written to ' + file.name + '.';
}
if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate()
    .then(estimate => {
      document.getElementById('usage').innerHTML = estimate.usage;
      document.getElementById('quota').innerHTML = estimate.quota;
      document.getElementById('percent').innerHTML = (estimate.usage * 100 / estimate.quota).toFixed(0);
    });
}

if ('storage' in navigator && 'persisted' in navigator.storage) {
  navigator.storage.persisted()
    .then(persisted => {
      document.getElementById('persisted').innerHTML = persisted ? 'persisted' : 'not persisted';
    });
}

function requestPersistence() {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    navigator.storage.persist()
      .then(persisted => {
        document.getElementById('persisted').innerHTML = persisted ? 'persisted' : 'not persisted';
      });
  }
}
