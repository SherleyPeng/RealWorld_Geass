// RealWorld 言灵穿越 · 角色卡组装脚本
// 用法: node build-card.js
// 输出: dist/character-card.json
// 合并: 世界书(16卷) + 正则 + 脚本 → 单卡

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ── helpers ──

function makeEntry(uid, title, content, extra = {}) {
  return {
    uid,
    comment: title,
    content,
    constant: extra.constant ?? false,
    enabled: extra.enabled ?? true,
    order: extra.order ?? 100,
    position: extra.position ?? 0,
    depth: extra.depth ?? 4,
    use_regex: false,
    keys: extra.keys ?? [],
    keysecondary: [],
    display_index: 0,
    recursion: {
      delay_until: null,
      prevent_outgoing: true,
      prevent_incoming: true
    },
    selectiveLogic: 0
  };
}

// ── 1. Read cover ──

const imgBase64 = fs.readFileSync(path.join(ROOT, 'cover.jpg')).toString('base64');

// ── 2. Read card text ──

const description = fs.readFileSync(path.join(ROOT, 'card', 'card-description.txt'), 'utf8');
const firstMessage = fs.readFileSync(path.join(ROOT, 'card', 'first-message.txt'), 'utf8');

// ── 3. Merge ALL world books ──

const wbDir = path.join(ROOT, 'worldbooks');
const wbFiles = fs.readdirSync(wbDir)
  .filter(f => f.endsWith('.json'))
  .sort(); // 01-protocol first, then 02-2013 ... 16-celebrities

let uidCounter = 0;
const allEntries = [];

for (const file of wbFiles) {
  const wbPath = path.join(wbDir, file);
  const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));

  const entriesObj = wb.entries;
  if (!entriesObj) {
    console.warn(`  WARN: ${file} has no entries key, skipping`);
    continue;
  }

  // Support both object format {"1": {...}} and array format [{...}]
  const entryList = Array.isArray(entriesObj)
    ? entriesObj
    : Object.values(entriesObj);

  for (const e of entryList) {
    uidCounter++;
    const extra = {
      constant: e.constant ?? false,
      enabled: !e.disable,
      order: e.order ?? 100,
      position: e.position ?? 0,
      depth: e.depth ?? 4,
      keys: e.keys ?? []
    };
    allEntries.push(makeEntry(uidCounter, e.title, e.content, extra));
  }
  console.log(`  ${file}: ${entryList.length} entries (UIDs up to ${uidCounter})`);
}

console.log(`Total world book entries: ${allEntries.length}\n`);

// ── 4. Build regex_scripts ──

const regexJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'regex', '01-statusbar.json'), 'utf8'));
const regexScripts = [{
  scriptName: regexJson.scriptName,
  findRegex: regexJson.findRegex,
  replaceString: regexJson.replaceString,
  placement: regexJson.placement || [2],
  markdownOnly: regexJson.markdownOnly === true,
  promptOnly: regexJson.promptOnly === true,
  disabled: regexJson.disabled === true,
  runOnEdit: regexJson.runOnEdit !== false
}];
console.log(`Regex: 1 script embedded`);

// ── 5. Build tavern_helper.scripts ──

const scriptsDir = path.join(ROOT, 'scripts');
const scriptFiles = fs.readdirSync(scriptsDir)
  .filter(f => f.endsWith('.json'))
  .sort();

const tavernScripts = [];
for (const file of scriptFiles) {
  const s = JSON.parse(fs.readFileSync(path.join(scriptsDir, file), 'utf8'));
  tavernScripts.push({
    info: s.info || '',
    id: s.id || '',
    type: 'script',
    data: s.data || {},
    content: s.content?.value || '',
    button: { buttons: [], enabled: false },
    name: s.name || file.replace('.json', ''),
    export_with: { button: true, data: true },
    enabled: s.enabled !== false
  });
  console.log(`  Script: ${s.id}`);
}
console.log(`Scripts: ${tavernScripts.length} embedded\n`);

// ── 6. Assemble card ──

const card = {
  spec: 'chara_card_v2',
  spec_version: '2.0',
  data: {
    name: '真实世界·言灵穿越',
    description: description.trim(),
    first_mes: firstMessage.trim(),
    avatar: 'data:image/jpeg;base64,' + imgBase64,
    system_prompt: '',
    post_history_instructions: '',
    tags: ['真实世界', '言灵穿越', '3D建模', '北京2013', '平行世界'],
    creator: 'RealWorld Project',
    character_version: '1.7.8',
    character_book: {
      entries: allEntries,
      extensions: {},
      name: '真实世界·言灵穿越'
    },
    extensions: {
      regex_scripts: regexScripts,
      tavern_helper: {
        scripts: tavernScripts
      }
    }
  }
};

// ── 7. Write output ──

const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

const outputPath = path.join(distDir, 'character-card.json');
fs.writeFileSync(outputPath, JSON.stringify(card), 'utf8');

const stats = fs.statSync(outputPath);
console.log(`character-card.json: ${(stats.size / 1024).toFixed(0)} KB`);
console.log(`  entries: ${allEntries.length}`);
console.log(`  regex: ${regexScripts.length}`);
console.log(`  scripts: ${tavernScripts.length}`);
console.log(`  output: ${outputPath}`);
