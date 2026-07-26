# 真实世界：言灵穿越 — 部署指南

## 导入顺序

### 1. 角色卡（完整导入，推荐）
- 路径：`dist/character-card.json`
- 导入方式：SillyTavern → 角色管理 → 导入角色（选择文件）
- 角色卡已包含 cover.jpg 封面、description、first_mes
- 版本：1.7.8

### 2. Schema 脚本
- 路径：`scripts/01-register-schema.json`
- 导入方式：酒馆助手 → 脚本库 → 导入
- 命名为「真实世界_stat_data_schema」
- 确保脚本自动注册 schema（`registerMvuSchema('stat_data', StatDataSchema)`）

### 3. 世界书 — 协议规则
- 路径：`worldbooks/01-protocol-entries.json`
- 导入方式：世界书 → 导入
- 重命名为「真实世界·协议规则」
- 保持永久启用状态（切换为总是启用）

### 4. 世界书 — 年度背景（按需启用）
- 路径：`worldbooks/02-2013.json` 至 `worldbooks/15-2026.json`
- 每卷独立导入
- 对应年份到达时启用，建议使用世界书的关键词触发（键词如 "2013"）
- 或者手动管理：当前年份进到哪年开哪年

### 5. 名人 NPC 世界书
- 路径：`worldbooks/16-celebrities.json`
- 导入方式：世界书 → 导入
- 包含 21 位真实名人 NPC 档案
- 关键词触发（姓名），建议角色专用、按需启用

### 6. 状态栏（可选）
- 路径：正则 `regex/01-statusbar.json` 已内嵌完整状态栏（方式 A）
- 部署方式：

  **方式 A · 正则内嵌（推荐，已配置）**
   1. 直接导入 `regex/01-statusbar.json` 到 SillyTavern → 扩展 → 正则 → 导入
   2. 无需额外部署 statusbar 文件或桥接脚本
   3. 正则自动将 AI 输出的 `<status_bar></status_bar>` 占位符替换为可视化状态栏

  **方式 B · 独立 HTML 文件（备选）**
   1. 将 `statusbar/index.html` 复制到 SillyTavern 的 `data/` 目录下：
      - 旧版：`SillyTavern/data/statusbar/index.html`
      - 新版（v1.12+）：`SillyTavern/data/<用户名>/statusbar/index.html`
   2. 修改 `regex/01-statusbar.json` 的 `replaceString` 指向本地方案

  > 状态栏已改为**直接读取 Mvu 变量数据**，无需 iframe 桥接脚本（`statusbar-bridge.js` 已废弃，不再需要导入）。

### 7. 配套脚本（可选）
- 路径：`scripts/02-guardian.json` / `03-detector.json` / `04-observer.json`
- 导入方式：酒馆助手 → 脚本库 → 导入
- 建议导入全部三支，按需启用：

  | 脚本 | 作用 | 启用建议 |
  |------|------|----------|
  | `01-guardian.js` 变量守卫 | 自动验证 stat_data 完整性，每轮更新后检测数据异常 | 全程启用 |
  | `02-detector.js` 数据检测器 | 深度检测，提供 `/stat_check` 命令手动触发 | 全程启用 |
  | `03-observer.js` 变量观察器 | 监控变更日志，提供 `/stat_dump`(控制台) 和 `/stat_log`(变更记录) 命令 | 调试/开发时启用 |

### 8. 正则 — 状态栏注入
- 路径：`regex/01-statusbar.json`
- 导入方式：扩展 → 正则 → 导入
- 此正则自动将 AI 输出的 `<status_bar></status_bar>` 占位符替换为可视化状态栏（内嵌 HTML+CSS+JS）
- 状态栏直接从 Mvu 读取变量数据，无需 iframe 桥接脚本
- 确保正则状态为启用

## 配置检查

### MVU 设置
- 确认 `registerMvuSchema` 已正确注册 stat_data 的 schema
- InitVar 条目（uid 9）自动保持禁用状态（disable=true），无需手动操作

### 世界书设置
- 协议规则世界书 → 角色专用、永久启用
- 年份世界书 → 角色专用、按年份关键词触发

### 输出格式
- 变量更新使用 RFC 6902 JSONPatch
- LLM 的每轮输出末尾应包含 JSONPatch 变更数组

## 验证清单

- [ ] 新开对话，确认 stat_data 成功初始化
- [ ] 发送一条消息，确认变量更新生效
- [ ] 输入「过了 7 天」确认日期推进
- [ ] 确认选择栏格式正确输出
- [ ] 确认 AI 回复末尾包含 `<status_bar></status_bar>` 占位符
- [ ] 确认占位符被正则替换为可视化状态栏
- [ ] 确认状态栏各 Tab（状态/关系/言灵/声望）数据正确显示
- [ ] 切换到 2013 世界书年份，确认相关键词触发
- [ ] 脚本库中确认三支脚本已导入
- [ ] 查看控制台确认变量守卫无报错
- [ ] 输入 `/stat_check` 确认检测器运行
- [ ] 输入 `/stat_log` 确认观察器显示变更记录

## 文件清单

```
RealWorld_Geass/
├── dist/
│   └── character-card.json   — 完整角色卡（含 cover.jpg 封面，可导入）
├── schema/
│   ├── stat_data.ts          — Zod schema 源文件
│   └── register-schema.js    — schema 注册脚本源码
├── scripts/
│   ├── 01-register-schema.json — schema 注册 (可导入, 酒馆助手→脚本库)
│   ├── 02-guardian.json     — 变量守卫 (可导入)
│   ├── 03-detector.json     — 数据检测器 (可导入)
│   ├── 04-observer.json     — 变量观察器 (可导入)
│   ├── 01-guardian.js        — 守卫源码
│   ├── 02-detector.js        — 检测器源码
│   └── 03-observer.js        — 观察器源码
├── card/
│   ├── card-description.txt  — 角色 description 字段内容
│   └── first-message.txt     — 角色 first_mes 开场白
├── worldbooks/
│   ├── 01-protocol-entries.json  — 协议规则世界书（常驻永久启用）
│   ├── 02-2013.json              — 2013 年度背景
│   ├── 03-2014.json              — 2014 年度背景
│   ├── 04-2015.json              — 2015 年度背景
│   ├── 05-2016.json              — 2016 年度背景
│   ├── 06-2017.json              — 2017 年度背景
│   ├── 07-2018.json              — 2018 年度背景
│   ├── 08-2019.json              — 2019 年度背景
│   ├── 09-2020.json              — 2020 年度背景
│   ├── 10-2021.json              — 2021 年度背景
│   ├── 11-2022.json              — 2022 年度背景
│   ├── 12-2023.json              — 2023 年度背景
│   ├── 13-2024.json              — 2024 年度背景
│   ├── 14-2025.json              — 2025 年度背景
│   ├── 15-2026.json              — 2026 年度背景
│   └── 16-celebrities.json       — 名人 NPC 档案（21 位）
├── statusbar/
│   └── index.html            — 状态栏前端（自包含 HTML+CSS+JS）
├── regex/
│   └── 01-statusbar.json     — 状态栏占位符→iframe 正则
├── scripts/
│   ├── 01-guardian.js        — 变量守卫（自动验证 stat_data）
│   ├── 02-detector.js        — 数据检测器（/stat_check 深度检测）
│   └── 03-observer.js        — 变量观察器（/stat_dump /stat_log 调试）
├── docs/
│   ├── deployment-guide.md   — 部署指南
│   └── variable-update-rules.md — 变量更新规则（完整版）
└── build-card.js             — 角色卡组装脚本（node build-card.js）
```
