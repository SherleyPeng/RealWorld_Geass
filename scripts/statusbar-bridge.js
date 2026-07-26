// ==UserScript==
// @name        真实世界·状态栏桥接
// @version     1.8.0
// @description postMessage 桥接：响应状态栏请求，推送 MVU 数据到 iframe
// @author      RealWorld Project
// ==/UserScript==

(function() {
  'use strict';

  var NAME = '[RealWorld SB-Bridge]';

  function getStatData() {
    try {
      if (typeof Mvu !== 'undefined' && Mvu.getMvuData) {
        var raw = Mvu.getMvuData({ type: 'chat' });
        if (raw && raw.stat_data) {
          var sd = raw.stat_data;
          // Unwrap double-nesting
          if (sd.stat_data && typeof sd.stat_data === 'object' && sd.stat_data.user) {
            return sd.stat_data;
          }
          return sd;
        }
      }
    } catch(e) {}
    return null;
  }

  function pushToIframes() {
    var sd = getStatData();
    if (!sd) return;
    var msg = { type: 'sb-data', stat_data: sd };
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      try {
        iframes[i].contentWindow.postMessage(msg, '*');
      } catch(e) {}
    }
  }

  // Respond to status bar requests
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'rw-sb-request') return;
    var sd = getStatData();
    if (sd && e.source) {
      e.source.postMessage({ type: 'sb-data', stat_data: sd }, '*');
    }
  });

  // Push data on MVU events
  function init() {
    if (typeof Mvu !== 'undefined') {
      try {
        Mvu.on('mag_variable_initiailized', function() {
          setTimeout(pushToIframes, 1500);
        });
        Mvu.on('mag_variable_update_ended', function() {
          setTimeout(pushToIframes, 500);
        });
        console.log(NAME, 'Bridge active');
        setTimeout(pushToIframes, 3000);
      } catch(e) {}
    } else if (typeof waitGlobalInitialized === 'function') {
      waitGlobalInitialized('Mvu').then(function() {
        Mvu.on('mag_variable_initiailized', function() {
          setTimeout(pushToIframes, 1500);
        });
        Mvu.on('mag_variable_update_ended', function() {
          setTimeout(pushToIframes, 500);
        });
        console.log(NAME, 'Bridge active (deferred)');
        setTimeout(pushToIframes, 3000);
      }).catch(function() {
        console.warn(NAME, 'Mvu not available');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 1000); });
  } else {
    setTimeout(init, 1000);
  }
})();
