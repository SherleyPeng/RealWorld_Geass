# 变量更新规则（完整版）

## 方言标准

RFC 6902 JSONPatch。允许操作：`add` / `replace` / `remove`。

## 顶层约束

- 每轮只输出实际发生的变更，不重写未变字段
- `_meta` 只读（UID 计数器由 AI 在创建新条目时更新）
- `user` 只读（开场设定后不可改）
- `items.{uid}` 由 AI 按物品更新规则管理
- `assets.cash` / `assets.bank` 由 AI 按消费/收入更新
- 路径中的 key 一律使用 UID 格式 `前缀_NNN`（如 `geass_001`、`tasks_003`）

## 各字段更新规则

### time
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| time.current_date | AI | user 说"过了 N 天"时 |
| time.day_count | AI | 同 current_date |

更新 current_date 后 AI 自动重算所有 sexual.*.cycle.phase。

### geass.{uid}
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| geass.{uid} | AI | user 首次使用该言灵时 add |
| geass.{uid}.total_uses | AI | 每次使用时 replace +1 |
| geass.{uid}.use_history.{use_id} | AI | 每次使用时 add 记录 |

### tasks.{uid}
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| tasks.{uid} | AI | 接到新任务时 add |
| tasks.{uid}.status | AI | 任务状态变更时 replace |

### npc_relations.{uid}
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| npc_relations.{uid} | AI | 首次遇到重要 NPC 时 add |
| npc_relations.{uid}.impression | AI | 互动后酌情 replace |
| npc_relations.{uid}.context | AI | 关系变化时 replace |

### sexual.{uid}
同 npc_relations 建档规则，只在遇到女性可发展关系的 NPC 时创建。
额外字段 pregnancy 在无保护行为后由 AI 随机判定是否更新。

### reputation.{uid}
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| reputation.{uid} | AI | 首次在该势力中建立名声时 add |
| reputation.{uid}.value | AI | 重大行为后 replace |

### world.known_regions / world.location_library
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| world.known_regions.{uid} | AI | user 到达新区域时 add |
| world.location_library.{uid} | AI | user 访问新地点时 add |

### situation
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| situation.current | AI | 每轮更新为一句话处境 |
| situation.opportunities | AI | 每轮 replace 为当前可参与的机遇 |

### items.{uid}
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| items.{uid} | AI | 获得新物品时 add |
| items.{uid}.quantity | AI | 数量变化时 replace |
| items.{uid} | AI | 数量归零时 remove |

### assets
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| assets.cash | AI | 消费/收入时 replace |
| assets.bank | AI | 银行存取时 replace |
| assets.companies.{uid} | AI | 获得股份时 add |
| assets.estates.{uid} | AI | 购房时 add |
| assets.vehicles.{uid} | AI | 购车时 add |

### _meta
| 路径 | 谁写 | 何时写 |
|------|------|--------|
| _meta.uid_counters.{prefix} | AI | 使用对应前缀创建新条目时 replace +1 |

## JSONPatch 输出示例

```
[
  {"op":"replace","path":"/time/current_date","value":"2013-01-15"},
  {"op":"add","path":"/geass/geass_001","value":{"name":"..."}},
  {"op":"add","path":"/geass/geass_001/use_history/use_001","value":{"date":"2013-01-15","target":"...","effect_desc":"..."}},
  {"op":"replace","path":"/geass/geass_001/total_uses","value":1},
  {"op":"replace","path":"/situation/current","value":"在北京朝阳区街头，早餐摊前"},
  {"op":"replace","path":"/assets/cash","value":150},
  {"op":"replace","path":"/assets/bank","value":3200},
  {"op":"add","path":"/items/items_001","value":{"name":"地铁卡","quantity":1,"description":"余额约50元"}},
  {"op":"replace","path":"/_meta/uid_counters/geass","value":1}
]
```
