let DOMEvents = (function() {
    
  let eventsMap = {
      onclick: {
  		  'handle-click-recording-list': (evt) => app.HandleClickRecordingList(evt),
      	'start-capture': () => app.StartCapture(),
    		'download-all': () => app.DownloadAll(),
      },
  };
  
  
  let listening = function(selector, dataKey, eventType, callbacks) {
    let elements = document.querySelectorAll(selector);
    for (let el of elements) {
      let callbackFunc = callbacks[el.dataset[dataKey]];
      el.addEventListener(eventType, callbackFunc);
    }
  };
  
  function Init() {
    listening('[data-onclick]', 'onclick', 'click', eventsMap.onclick);
  }
  
  return {
    Init,
  };

})();
