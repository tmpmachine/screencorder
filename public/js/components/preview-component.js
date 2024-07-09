let compoPreview = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    Play: Play_,
    PlayFromId,
    Init,
  };
  
  // # local
  let local = {
    states: {
      firstLoad: false,
      videoTimeFixed: false,
    },
    videoEl: $('._previewVideo'),
    playQueue: [],
  };
  
  function PlayFromId(id) {
    let data = compoRecording.GetDataById(id);
    let videoEl = local.videoEl;    
    
    videoEl.src = data.url;
    
    refreshListActivePreviewItem(id);
  }
  
  function refreshListActivePreviewItem(id) {
    $('._listFinalRecording [data-kind="itemRecording"]._active')?.classList.remove('_active');
    $(`._listFinalRecording [data-kind="itemRecording"][data-id="${id}"]`)?.classList.add('_active');
  }
  
  function Init() {
    local.videoEl.addEventListener('durationchange', () => handleChangeDuration());
  }
  
  function handleChangeDuration() {
    local.videoEl.currentTime = 1000000000;
  }
  
  function resetStates() {
    for (let key in local.states) {
      local.states[key] = false;
    }
  }
  
  async function Play_() {
    let items = await compoRecording.GetAll_();
    local.playQueue = items.map(x => x[1].id);
    
    playNextRecording();
  }
  
  function playNextRecording() {
    let recordingId = local.playQueue.shift();
    if (!recordingId) return;
    
    let data = compoRecording.GetDataById(recordingId);
    
    let videoEl = local.videoEl;    
    videoEl.src = data.url;
  }
  
  
  return SELF;
  
})();