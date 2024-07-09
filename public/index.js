import { loadScripts } from './script-loader.js';

window.GLOBAL = {
  appId: 'screencorder-Mzg3NjgzNzY',
};

// libraries
window._idbKeyval = window.idbKeyval;

(function() {

  loadScripts([
    {
      urls: [
        'js/components/recording-component.js',
        'js/components/preview-component.js',
        'js/app.js',
        'js/ui.js',
      ],
      callback: function() {
        compoRecording.Init();
        app.Init();
        ui.Init();
      }
    },
    {
      urls: [
        'js/utils/wait.js',
      ]
    },
  ]);
  
})();