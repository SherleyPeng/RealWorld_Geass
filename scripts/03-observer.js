// ==UserScript==
// @name        真实世界·变量观察器
// @version     1.0.0
// @description 监控 stat_data 变更，日志与调试
// @author      RealWorld Project
// ==/UserScript==

(function() {
  'use strict';

  var NAME = '[RealWorld Observer]';
  var initFired = false;
  var changeLog = [];
  var MAX_LOG = 50;

  function getStatData() {
    try {
      if (typeof getMvuData === 'function') return getMvuData('latest');
      if (typeof getVariables === 'function') return getVariables();
    } catch (e) {}
    return null;
  }

  function logChange(type, summary) {
    var data = getStatData();
    var ctx = '';
    if (data && data.time) {
      ctx = 'day=' + data.time.day_count + ' date=' + data.time.current_date;
    }
    changeLog.push({
      ts: new Date().toLocaleTimeString(),
      type: type,
      summary: summary,
      context: ctx
    });
    if (changeLog.length > MAX_LOG) changeLog.shift();
  }

  function onInit(variables) {
    if (initFired) return;
    initFired = true;
    var msg = 'stat_data 已初始化';
    logChange('INIT', msg);
    console.log(NAME, msg, variables ? Object.keys(variables).join(', ') : '');
    if (typeof toastr === 'object' && toastr.info) {
      toastr.info('变量系统已就绪', '🔄 真实世界', { timeOut: 3000 });
    }
  }

  function onUpdateStart(patches) {
    if (!patches || patches.length === 0) return;
    var paths = patches.map(function(p) { return p.path; }).join(', ');
    logChange('UPDATE_START', patches.length + ' patches: ' + paths.slice(0, 80));
    console.log(NAME, 'Update patches:', patches);
  }

  function onUpdateEnd() {
    var data = getStatData();
    if (data && data.time) {
      logChange('UPDATE_END', 'day=' + data.time.day_count + ' @ ' + data.time.current_date);
    }
  }

  function dumpState() {
    var data = getStatData();
    if (data) {
      var summary = Object.keys(data).join(', ');
      console.log('=== stat_data dump ===');
      console.log(JSON.stringify(data, null, 2));
      console.log('=== end dump (keys: ' + summary + ') ===');
      if (typeof toastr === 'object' && toastr.success) {
        toastr.success('已输出到控制台 (F12)', '📋 stat_data dump', { timeOut: 3000 });
      }
    } else {
      console.warn(NAME, 'stat_data 不存在');
      if (typeof toastr === 'object' && toastr.warning) {
        toastr.warning('stat_data 不存在', '📋 dump', { timeOut: 2000 });
      }
    }
  }

  function showLog() {
    if (changeLog.length === 0) {
      if (typeof toastr === 'object' && toastr.info) {
        toastr.info('尚无变更记录', '📋 变更日志', { timeOut: 2000 });
      }
      return;
    }
    var recent = changeLog.slice(-10);
    var text = '最近 ' + recent.length + ' 条记录:\n' + recent.map(function(e) {
      return e.ts + ' [' + e.type + '] ' + e.summary + (e.context ? ' (' + e.context + ')' : '');
    }).join('\n');
    console.log(NAME + '\n' + text);
    if (typeof toastr === 'object' && toastr.info) {
      toastr.info(text.slice(0, 200).replace(/\n/g, '<br>'), '📋 变更日志', { timeOut: 5000, extendedTimeOut: 3000 });
    }
  }

  // ---- init ----
  (function init() {
    // Register slash commands
    if (typeof registerSlashCommand === 'function') {
      registerSlashCommand('stat_dump', dumpState, ['stat_dump'], '输出 stat_data 到控制台');
      registerSlashCommand('stat_log', showLog, ['stat_log'], '显示 stat_data 变更日志');
    }

    if (typeof Mvu === 'undefined' && typeof waitGlobalInitialized === 'function') {
      waitGlobalInitialized('Mvu').then(function() {
        Mvu.on('mag_variable_initiailized', onInit);
        Mvu.on('mag_variable_update_started', onUpdateStart);
        Mvu.on('mag_variable_update_ended', onUpdateEnd);
        console.log(NAME, 'Observer active');
        // Check if already initialized
        var data = getStatData();
        if (data && data.time && data.time.day_count !== undefined) {
          onInit(data);
        }
      }).catch(function() { console.warn(NAME, 'Mvu not available'); });
    } else if (typeof Mvu !== 'undefined') {
      Mvu.on('mag_variable_initiailized', onInit);
      Mvu.on('mag_variable_update_started', onUpdateStart);
      Mvu.on('mag_variable_update_ended', onUpdateEnd);
      console.log(NAME, 'Observer active');
      var data = getStatData();
      if (data && data.time && data.time.day_count !== undefined) {
        onInit(data);
      }
    } else {
      console.log(NAME, 'Observer active (commands only)');
    }
  })();
})();
