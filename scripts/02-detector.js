// ==UserScript==
// @name        真实世界·数据检测器
// @version     1.0.0
// @description 深度检测 stat_data 完整性，提供诊断报告
// @author      RealWorld Project
// ==/UserScript==

(function() {
  'use strict';

  var NAME = '[RealWorld Detector]';

  function getStatData() {
    try {
      if (typeof getMvuData === 'function') return getMvuData('latest');
      if (typeof getVariables === 'function') return getVariables();
    } catch (e) {}
    return null;
  }

  function runCheck(verbose) {
    var data = getStatData();
    if (!data) {
      if (verbose) console.warn(NAME, 'stat_data 不存在');
      return [];
    }

    var issues = [];

    // 1. Required fields
    var required = ['user', 'time', 'situation', '_meta', 'assets'];
    required.forEach(function(f) {
      if (!data[f] || (typeof data[f] === 'object' && Object.keys(data[f]).length === 0)) {
        issues.push('MISSING: ' + f);
      }
    });

    // 2. Numbers
    if (data.time && typeof data.time.day_count !== 'number') {
      issues.push('TYPE: time.day_count 非数字');
    }

    // 3. Impression bounds
    if (data.npc_relations) {
      Object.keys(data.npc_relations).forEach(function(k) {
        var r = data.npc_relations[k];
        if (r.impression !== undefined && (r.impression < -100 || r.impression > 100)) {
          issues.push('IMPRESSION_OOB: ' + (r.name || k) + '=' + r.impression);
        }
        if (!r.context) issues.push('MISSING_CONTEXT: ' + (r.name || k));
        if (!r.known_since) issues.push('MISSING_KNOWN_SINCE: ' + (r.name || k));
      });
    }

    // 4. virgin/body_count mismatch
    if (data.sexual) {
      Object.keys(data.sexual).forEach(function(k) {
        var s = data.sexual[k];
        if (s.virgin && s.body_count > 0) {
          issues.push('VIRGIN_BC: ' + (s.name || k) + ' virgin=' + s.virgin + ' body_count=' + s.body_count);
        }
      });
    }

    // 5. Counter consistency
    if (data._meta && data._meta.uid_counters) {
      var counters = data._meta.uid_counters;
      var sections = { geass: data.geass, tasks: data.tasks, npc_relations: data.npc_relations, sexual: data.sexual, reputation: data.reputation, items: data.items, companies: data.assets ? data.assets.companies : {}, estates: data.assets ? data.assets.estates : {}, vehicles: data.assets ? data.assets.vehicles : {} };
      Object.keys(sections).forEach(function(p) {
        var entries = sections[p] || {};
        var actual = Object.keys(entries).length;
        var counter = counters[p] !== undefined ? counters[p] : 0;
        if (counter < actual) issues.push('COUNTER: ' + p + ' count=' + counter + ' actual=' + actual);
      });
    }

    // 6. Asset values
    if (data.assets) {
      if (typeof data.assets.cash !== 'number' || data.assets.cash < 0) issues.push('ASSET: cash=' + data.assets.cash);
      if (typeof data.assets.bank !== 'number' || data.assets.bank < 0) issues.push('ASSET: bank=' + data.assets.bank);
    }

    // 7. Date format
    var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (data.time && data.time.current_date && !dateRegex.test(data.time.current_date)) {
      issues.push('DATE: ' + data.time.current_date);
    }
    if (data.user && data.user.birth_date && !dateRegex.test(data.user.birth_date)) {
      issues.push('BIRTH_DATE: ' + data.user.birth_date);
    }

    // 8. Items format
    if (data.items) {
      Object.keys(data.items).forEach(function(k) {
        var item = data.items[k];
        if (item.quantity !== undefined && (typeof item.quantity !== 'number' || item.quantity < 0)) {
          issues.push('ITEM_QTY: ' + (item.name || k) + ' quantity=' + item.quantity);
        }
      });
    }

    if (verbose) {
      if (issues.length > 0) {
        var report = 'stat_data 检测报告\n发现 ' + issues.length + ' 个问题:\n' + issues.join('\n');
        console.warn(NAME, '\n' + report);
        if (typeof toastr === 'object' && toastr.warning) {
          toastr.warning(report.replace(/\n/g, '<br>'), '🔍 数据检测', { timeOut: 12000, extendedTimeOut: 5000 });
        }
      } else {
        console.log(NAME, '无异常 ✓');
        if (typeof toastr === 'object' && toastr.success) {
          toastr.success('stat_data 无异常', '✅ 数据检测', { timeOut: 3000 });
        }
      }
    }

    return issues;
  }

  function runFullCheck() {
    runCheck(true);
  }

  // ---- init ----
  (function init() {
    if (typeof registerSlashCommand === 'function') {
      registerSlashCommand('stat_check', runFullCheck, ['stat_check'], '运行 stat_data 完整性检测');
    }

    // Run a lightweight check after each update
    if (typeof Mvu === 'undefined' && typeof waitGlobalInitialized === 'function') {
      waitGlobalInitialized('Mvu').then(function() {
        Mvu.on('mag_variable_update_ended', function() {
          var issues = runCheck(false);
          if (issues.length > 0) {
            console.log(NAME, '更新后检测发现 ' + issues.length + ' 个问题');
          }
        });
        console.log(NAME, 'Detector active');
        setTimeout(function() { runCheck(true); }, 3000);
      }).catch(function() { console.warn(NAME, 'Mvu not available, /stat_check still works'); });
    } else if (typeof Mvu !== 'undefined') {
      Mvu.on('mag_variable_update_ended', function() {
        var issues = runCheck(false);
        if (issues.length > 0) console.log(NAME, 'Post-update issues:', issues.length);
      });
      console.log(NAME, 'Detector active');
      setTimeout(function() { runCheck(true); }, 3000);
    } else {
      console.log(NAME, 'Detector active (/stat_check only)');
    }
  })();
})();
