let compoRecording = (function() {
  
  // # self
  let SELF = {
    GetAll_,
    Init,
    GetDataById,
    Add,
    Store,
  };

  // # local
  let local = {
    customStore: null,
    recordingData: [],
  }
  ;
  function Store(_id) {
    let {id, blob, url, title} = GetDataById(_id);
    let finalRecordEl = $(`#recording-list [data-id="${id}"]`);
    let updatedData = {
      id,
      blob,
      url,
      title,
    };
    
    finalRecordEl.querySelector('[data-slot="title"]').textContent = title;
    $('._listFinalRecording')?.append(finalRecordEl);
    idbKeyval.set(id, updatedData, local.customStore);
  }
  
  function Add(item) {
    local.recordingData.push(item);
  }
  
  function GetDataById(id) {
    return local.recordingData.find(x => x.id == id);
  }
  
  function Init() {
    local.customStore = idbKeyval.createStore(`db-${GLOBAL.appId}`, 'recordings');
  }
  
  async function GetAll_() {
    let entries = await idbKeyval.entries(local.customStore);
    return entries;
  }
  
  return SELF;
  
})();