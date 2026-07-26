// ============================================================
// RealWorld_Geass v1.8.0 Runtime Diagnostic
// 在 SillyTavern F12 Console 中粘贴执行
// ============================================================
console.clear();
console.log('%c=== RealWorld_Geass v1.8.0 DIAGNOSTIC ===', 'font-size:16px;color:#c8ad6a');

var R = {}; // Report object

// ---- 1. Environment ----
R.env = {};
try { R.env.Mvu = typeof Mvu; } catch(e) { R.env.Mvu = 'undefined'; }
try { R.env.TavernHelper = typeof TavernHelper; } catch(e) { R.env.TavernHelper = 'undefined'; }
try { R.env.z = typeof z; } catch(e) { R.env.z = 'undefined'; }
try { R.env.getVariables = typeof getVariables; } catch(e) { R.env.getVariables = 'undefined'; }
try { R.env.registerMvuSchema = typeof registerMvuSchema; } catch(e) { R.env.registerMvuSchema = 'undefined'; }
try { R.env.toastr = typeof toastr; } catch(e) { R.env.toastr = 'undefined'; }
console.log('%c[1] Environment', 'color:#c8ad6a');
console.table(R.env);

// ---- 2. MVU State ----
R.mvu = { loaded: false, hasStatData: false, statKeys: 'N/A', time: 'N/A' };
try {
  if (typeof Mvu !== 'undefined' && Mvu.getMvuData) {
    R.mvu.loaded = true;
    var chatData = Mvu.getMvuData({type:'chat'});
    R.mvu.chatKeys = chatData ? Object.keys(chatData).join(', ') : 'null';
    var msgData = Mvu.getMvuData({type:'message', message_id:'latest'});
    R.mvu.msgKeys = msgData ? Object.keys(msgData).join(', ') : 'null';
    if (msgData && msgData.stat_data) {
      R.mvu.hasStatData = true;
      var sd = msgData.stat_data;
      R.mvu.statKeys = Object.keys(sd).join(', ');
      R.mvu.time = JSON.stringify(sd.time);
      R.mvu.userName = sd.user && sd.user.name ? sd.user.name : 'N/A';
      R.mvu.dayCount = sd.time ? sd.time.day_count : 'N/A';
      R.mvu.situation = sd.situation ? sd.situation.current : 'N/A';
    }
  }
} catch(e) { R.mvu.error = e.message; }
console.log('%c[2] MVU State', 'color:#c8ad6a');
console.table(R.mvu);

// ---- 3. Character scripts ----
R.scripts = { count: 0, list: [] };
try {
  if (typeof getVariables === 'function') {
    var vars = getVariables({type:'character'});
    if (vars && vars.scripts) {
      R.scripts.count = vars.scripts.length;
      vars.scripts.forEach(function(s, i) {
        R.scripts.list.push({ idx: i, name: s.name, id: s.id, enabled: s.enabled, contentLen: s.content ? s.content.length : 0 });
      });
    }
  }
} catch(e) { R.scripts.error = e.message; }
console.log('%c[3] Character Scripts', 'color:#c8ad6a');
console.table(R.scripts.list);

// ---- 4. DOM Mounts ----
R.dom = {};
R.dom.rwSbMounts = document.querySelectorAll('.rw-sb-mount').length;
R.dom.mesText = document.querySelectorAll('.mes_text').length;
R.dom.blobIframes = document.querySelectorAll('iframe[src^="blob:"]').length;
R.dom.allIframes = document.querySelectorAll('iframe').length;
var mesTexts = document.querySelectorAll('.mes_text');
R.dom.firstMesHTML = mesTexts.length > 0 ? mesTexts[0].innerHTML.substring(0, 300) : 'none';
console.log('%c[4] DOM', 'color:#c8ad6a');
console.log('  .rw-sb-mount:', R.dom.rwSbMounts);
console.log('  .mes_text:', R.dom.mesText);
console.log('  blob iframes:', R.dom.blobIframes);
console.log('  all iframes:', R.dom.allIframes);
console.log('  first_mes preview:', R.dom.firstMesHTML);

// ---- 5. Console errors snapshot ----
R.consoleErrors = [];
try {
  // Passive check: is there evidence of errors?
  if (typeof Mvu !== 'undefined' && Mvu.getMvuData) {
    // Check if schema was registered
    R.mvu.schemaRegistered = typeof registerMvuSchema === 'function';
  }
} catch(e) {}
console.log('%c[5] Quick Checks', 'color:#c8ad6a');
console.log('  schema register fn:', R.mvu.schemaRegistered);

// ---- 6. Bridge script specific checks ----
R.bridge = { active: false };
try {
  // Check if MutationObserver is watching (indirect: try to find the script's global state)
  var obsElements = document.querySelectorAll('[data-rw-mounted]');
  R.bridge.mountedElements = obsElements.length;
  R.bridge.hasBridgeLog = false;
  // The bridge logs '[RealWorld SB-Bridge]' to console - we can't read historic logs
  // but we can check if any iframe has the status bar content
  var blobIframes = document.querySelectorAll('iframe[src^="blob:"]');
  for (var i = 0; i < blobIframes.length; i++) {
    try {
      var doc = blobIframes[i].contentDocument || blobIframes[i].contentWindow.document;
      if (doc && doc.querySelector('.sb')) {
        R.bridge.active = true;
        R.bridge.statusbarFound = true;
        R.bridge.iframeIndex = i;
        // Check if data is rendering
        var tabs = doc.querySelectorAll('.tab');
        R.bridge.tabCount = tabs.length;
        R.bridge.hasData = !doc.querySelector('.placeholder');
      }
    } catch(e) {}
  }
} catch(e) { R.bridge.error = e.message; }
console.log('%c[6] Status Bar Bridge', 'color:#c8ad6a');
console.table(R.bridge);

// ---- 7. Worldbook Entries (if accessible) ----
R.worldbook = {};
try {
  // ST 1.18 might expose worldbook state
  if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
    var ctx = SillyTavern.getContext();
    R.worldbook.ctxKeys = ctx ? Object.keys(ctx).join(', ') : 'null';
    if (ctx && ctx.characterBook) {
      var book = ctx.characterBook;
      R.worldbook.entries = book.entries ? book.entries.length : 0;
      R.worldbook.name = book.name;
    }
  }
} catch(e) { R.worldbook.error = e.message; }
console.log('%c[7] Worldbook', 'color:#c8ad6a');
console.table(R.worldbook);

// ---- Summary ----
console.log('%c=== SUMMARY ===', 'font-size:14px;color:#c8ad6a');
var issues = [];
if (!R.mvu.loaded) issues.push('MISSING: MVU not loaded');
if (!R.mvu.hasStatData) issues.push('MISSING: stat_data not initialized');
if (R.dom.rwSbMounts === 0) issues.push('MISSING: no .rw-sb-mount elements (regex not firing)');
if (R.dom.blobIframes === 0 && R.dom.rwSbMounts > 0) issues.push('MISSING: mounts exist but no blob iframes (bridge not injecting)');
if (R.bridge.active) issues.push('OK: status bar iframe detected and rendering');
if (issues.length === 0) issues.push('All checks nominal');
issues.forEach(function(s) { console.log(s); });

console.log('%cCopy entire output and paste to me', 'color:#888');
