let ui = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    Init,
  };
  
  // # local
  let local = {
    videoEl: $('._previewVideo'),
  }
  
  function Init() {
    attachKeyboardShortcut();
  }
  
  function attachKeyboardShortcut() {
    // ctrl+enter
    window.addEventListener('keydown', function(event) {
      let tagName = event.target.tagName;
      if (['TEXTAREA', 'INPUT'].includes(tagName)) return;
      
      if (event.ctrlKey && event.key == 'Enter') {
        event.preventDefault();
        compoPreview.Play();
      }
      handleKeyboardVideoControls(event);
      
    });
  }
  
  function handleKeyboardVideoControls(evt) {
    // if (!(document.activeElement == local.videoEl || document.activeElement == document.body)) return;
    
    let {ctrlKey, shiftKey, key} = evt;
    let keyOnly = !ctrlKey && !shiftKey;
    let videoEl = local.videoEl;
    
    if (keyOnly) {
      switch (key) {
        case 'k':
          if (videoEl.paused || videoEl.ended) {
            videoEl.play();
          } else {
            videoEl.pause();
          }
          break;
        
        default:
          // code
      }      
    }
  }
  
  return SELF;
  
})();