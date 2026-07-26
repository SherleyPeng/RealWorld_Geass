// Build script importable JSON wrappers for Tavern Helper
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const scriptsDir = path.join(ROOT, 'scripts');
const schemaDir = path.join(ROOT, 'schema');

const items = [
  {
    out: '00-mvu-loader.json',
    src: path.join(scriptsDir, '00-mvu-loader.js'),
    id: 'realworld-mvu-loader-v1',
    name: 'MVU框架加载器',
    info: '加载 MVU (MagVarUpdate) 框架。必须先启用。国内 CDN。若加载失败可换国外 CDN 版。'
  },
  {
    out: '01-register-schema.json',
    src: path.join(schemaDir, 'register-schema.js'),
    id: 'realworld-schema-register-v1',
    name: 'Schema注册',
    info: '注册 stat_data zod Schema 到 MVU 管线。依赖 MVU 框架加载器。'
  },
  {
    out: '02-statusbar-bridge.json',
    src: path.join(scriptsDir, 'statusbar-bridge.js'),
    id: 'realworld-sb-bridge-v1',
    name: '状态栏桥接',
    info: 'postMessage 桥接：接收状态栏 iframe 请求，自动推送 MVU 数据。状态栏显示必需。'
  },
  {
    out: '03-guardian.json',
    src: path.join(scriptsDir, '01-guardian.js'),
    id: 'realworld-guardian-v1',
    name: '变量守卫',
    info: '自动验证 stat_data 完整性，检测数据异常。全程启用。'
  },
  {
    out: '04-detector.json',
    src: path.join(scriptsDir, '02-detector.js'),
    id: 'realworld-detector-v1',
    name: '数据检测器',
    info: '深度检测 stat_data 完整性，提供 /stat_check 命令手动触发诊断报告。'
  },
  {
    out: '05-observer.json',
    src: path.join(scriptsDir, '03-observer.js'),
    id: 'realworld-observer-v1',
    name: '变量观察器',
    info: '监控 stat_data 变更日志，提供 /stat_dump 和 /stat_log 调试命令。'
  }
];

items.forEach(item => {
  const code = fs.readFileSync(item.src, 'utf8');
  const wrapper = {
    info: item.info,
    id: item.id,
    name: item.name,
    type: 'script',
    data: {},
    content: { value: code },
    enabled: true
  };
  const outPath = path.join(scriptsDir, item.out);
  fs.writeFileSync(outPath, JSON.stringify(wrapper, null, 2), 'utf8');
  console.log('Created: ' + item.out + ' (' + code.length + ' chars)');
});
