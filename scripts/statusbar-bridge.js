// ==UserScript==
// @name        真实世界·状态栏桥接
// @version     1.0.0
// @description postMessage 桥接：接收状态栏 iframe 请求，推送 MVU 数据
// @author      RealWorld Project
// ==/UserScript==

(function() {
  'use strict';

  var NAME = '[RealWorld SB-Bridge]';
  var SB_SELECTOR = 'iframe[src*="statusbar"]';

  function getStatData() {
    try {
      if (typeof Mvu !== 'undefined' && Mvu.getMvuData) {
        var data = Mvu.getMvuData({type:'message', message_id:'latest'});
        if (data && data.stat_data) return data.stat_data;
        var chatData = Mvu.getMvuData({type:'chat'});
        if (chatData) return chatData;
      }
    } catch(e) {}
    try {
      if (typeof getVariables === 'function') {
        var v = getVariables({type:'message'});
        if (v && v.stat_data) return v.stat_data;
        return v;
      }
    } catch(e) {}
    return null;
  }

  function pushToStatusbar() {
    var sd = getStatData();
    if (!sd) return;
    var msg = {type:'sb-data', stat_data:sd};
    var iframes = document.querySelectorAll(SB_SELECTOR);
    for (var i = 0; i < iframes.length; i++) {
      try {
        iframes[i].contentWindow.postMessage(msg, '*');
      } catch(e) {}
    }
  }

  function handleMessage(e) {
    if (!e.data || e.data.type !== 'sb-getData') return;
    // Verify the source is a statusbar iframe
    var iframes = document.querySelectorAll(SB_SELECTOR);
    var fromSB = false;
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === e.source) { fromSB = true; break; }
    }
    if (!fromSB) return;
    pushToStatusbar();
  }

  function init() {
    window.addEventListener('message', handleMessage);

    // Push data on MVU events
    if (typeof Mvu !== 'undefined') {
      Mvu.on('mag_variable_initiailized', function() {
        setTimeout(pushToStatusbar, 1500);
      });
      Mvu.on('mag_variable_update_ended', function() {
        setTimeout(pushToStatusbar, 800);
      });
      console.log(NAME, 'Bridge active (MVU events)');
    } else if (typeof waitGlobalInitialized === 'function') {
      waitGlobalInitialized('Mvu').then(function() {
        Mvu.on('mag_variable_initiailized', function() {
          setTimeout(pushToStatusbar, 1500);
        });
        Mvu.on('mag_variable_update_ended', function() {
          setTimeout(pushToStatusbar, 800);
        });
        console.log(NAME, 'Bridge active (deferred MVU)');
      }).catch(function() {
        console.warn(NAME, 'Mvu not available, polling mode');
        // Fallback: poll for data
        setInterval(pushToStatusbar, 5000);
      });
    } else {
      console.warn(NAME, 'No Mvu, polling mode');
      setInterval(pushToStatusbar, 5000);
    }

    // Initial push after DOM settles
    setTimeout(pushToStatusbar, 3000);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 2000);
    });
  } else {
    init();
  }
})();
