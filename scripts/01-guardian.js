// ==UserScript==
// @name        真实世界·变量守卫
// @version     1.0.0
// @description 自动验证 stat_data 完整性，检测数据异常
// @author      RealWorld Project
// ==/UserScript==

(function() {
  'use strict';

  var NAME = '[RealWorld Guardian]';
  var VALIDATION_ENABLED = true;

  function getStatData() {
    try {
      if (typeof getMvuData === 'function') return getMvuData('latest');
      if (typeof getVariables === 'function') return getVariables();
    } catch (e) {}
    return null;
  }

  function validate() {
    if (!VALIDATION_ENABLED) return;

    var data = getStatData();
    if (!data) return;

    var issues = [];

    // 1. Required fields
    if (!data.user || !data.user.name) issues.push('user.name 为空');
    if (!data.time || !data.time.current_date) issues.push('time.current_date 为空');
    if (!data.situation || !data.situation.current) issues.push('situation.current 为空');
    if (!data._meta || !data._meta.schema_version) issues.push('_meta.schema_version 缺失');

    // 2. Asset validation
    if (data.assets) {
      if (typeof data.assets.cash !== 'number' || data.assets.cash < 0) issues.push('assets.cash 无效');
      if (typeof data.assets.bank !== 'number' || data.assets.bank < 0) issues.push('assets.bank 无效');
      if (typeof data.assets.companies !== 'object') issues.push('assets.companies 非对象');
      if (typeof data.assets.estates !== 'object') issues.push('assets.estates 非对象');
      if (typeof data.assets.vehicles !== 'object') issues.push('assets.vehicles 非对象');
    }

    // 3. Impression range check
    if (data.npc_relations) {
      Object.keys(data.npc_relations).forEach(function(k) {
        var r = data.npc_relations[k];
        if (r.impression !== undefined) {
          if (r.impression < -100 || r.impression > 100) {
            issues.push((r.name || k) + ': impression=' + r.impression + ' 超出 [-100,100]');
          }
        }
        if (!r.context || !r.context.taboos || !r.context.unresolved_promises) {
          issues.push((r.name || k) + ': context 字段不完整');
        }
      });
    }

    // 4. virgin vs body_count consistency
    if (data.sexual) {
      Object.keys(data.sexual).forEach(function(k) {
        var s = data.sexual[k];
        if (s.virgin && s.body_count > 0) {
          issues.push((s.name || k) + ': virgin=true 但 body_count=' + s.body_count);
        }
      });
    }

    // 5. UID counter consistency
    if (data._meta && data._meta.uid_counters) {
      var counters = data._meta.uid_counters;
      var sections = {
        geass: data.geass,
        tasks: data.tasks,
        npc_relations: data.npc_relations,
        sexual: data.sexual,
        reputation: data.reputation,
        items: data.items
      };
      Object.keys(sections).forEach(function(prefix) {
        var entries = sections[prefix] || {};
        var actual = Object.keys(entries).length;
        var counter = counters[prefix] !== undefined ? counters[prefix] : 0;
        if (counter < actual) {
          issues.push(prefix + ': 计数器=' + counter + ' 但实际=' + actual);
        }
      });
    }

    // 6. Date format
    var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (data.time && data.time.current_date && !dateRegex.test(data.time.current_date)) {
      issues.push('time.current_date 格式异常: ' + data.time.current_date);
    }

    if (issues.length > 0) {
      var msg = 'stat_data 发现 ' + issues.length + ' 个问题:\n' + issues.slice(0, 6).join('\n');
      if (issues.length > 6) msg += '\n...及其他 ' + (issues.length - 6) + ' 项';
      if (typeof toastr === 'object' && toastr.warning) {
        toastr.warning(msg.replace(/\n/g, '<br>'), '⚠ 变量守卫', { timeOut: 10000, extendedTimeOut: 5000 });
      }
      console.warn(NAME, 'Issues:', issues);
    }
  }

  // ---- init ----
  (function init() {
    if (typeof Mvu === 'undefined' && typeof waitGlobalInitialized === 'function') {
      waitGlobalInitialized('Mvu').then(function() {
        Mvu.on('mag_variable_update_ended', validate);
        Mvu.on('mag_variable_initiailized', validate);
        console.log(NAME, 'Guardian active');
        // Run initial check
        setTimeout(validate, 2000);
      }).catch(function() {
        console.warn(NAME, 'Mvu not available');
      });
    } else if (typeof Mvu !== 'undefined') {
      Mvu.on('mag_variable_update_ended', validate);
      Mvu.on('mag_variable_initiailized', validate);
      console.log(NAME, 'Guardian active');
      setTimeout(validate, 2000);
    } else {
      console.warn(NAME, 'Mvu not found, retrying...');
      setTimeout(init, 3000);
    }
  })();
})();
