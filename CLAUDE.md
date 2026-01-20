# CLAUDE.md - 太吾小游戏项目指南

## 项目概述

一款受《太吾绘卷》启发的武侠文字游戏 Demo。采用极简夜读 MUD 风格界面，实现了角色养成、功法系统、装备系统、产业经营和回合制战斗。

## 技术栈

- **框架**: Vue 3 (Composition API + script setup)
- **构建**: Vite 7
- **测试**: Vitest + @vue/test-utils
- **存储**: LocalStorage (带版本迁移)

## 快速命令

```bash
cd wuxia-game
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run test     # 运行测试
```

## 目录结构

```
taiwu-mini-demo/
├── docs/
│   └── design.md              # 中文设计文档 (主)
├── wuxia-game/
│   ├── src/
│   │   ├── App.vue            # 主界面 (菜单/游戏/战斗视图切换)
│   │   ├── main.js            # Vue 入口
│   │   ├── gameLogic.js       # 核心游戏逻辑 (~1000行)
│   │   ├── components/
│   │   │   └── CombatView.vue # 全屏战斗界面
│   │   ├── data/
│   │   │   ├── kungfu.js      # 功法定义
│   │   │   └── items.js       # 装备定义
│   │   ├── utils/
│   │   │   └── storage.js     # 存档管理 (v2 多存档)
│   │   └── tests/             # 单元测试
│   └── docs/
│       └── design.md          # 英文设计文档
└── CLAUDE.md                  # 本文件
```

---

## 核心系统：设计与实现对照

### 1. 角色属性系统

| 设计文档 | 实现位置 | 实现状态 |
|---------|---------|---------|
| 6项基础属性 (力道/卸力/破体/御体/破气/御气) | `gameLogic.js:33-40` defaultPlayerState | 完全实现 |
| 初始值 50-60 随机 | `gameLogic.js:177-182` createSaveInSlot | 完全实现 |
| 真气上限 80-280 | `gameLogic.js:18` MAX_QI, `defaultPlayerState.qi` | 完全实现 |
| 真气分配 (摧破/护体) | `gameLogic.js:589-629` allocateQi 系列函数 | 完全实现 |

**内力类型倍率表** (`gameLogic.js:23-30`):
```
类型      力道/卸力  破体/御体  破气/御气
金刚        10         16         4
紫霞         4          6        14
玄阴         4          4        16
纯阳         6         10        10
归元         6         14         6
混元         6         10        10
```

**最终属性计算** (`gameLogic.js:101-131` effectiveStats):
```
最终属性 = 基础属性 + (分配真气 × 类型倍率) + 装备加成
```

---

### 2. 功法系统

| 设计文档 | 实现位置 | 实现状态 |
|---------|---------|---------|
| 内功决定内力类型 | `kungfu.js` neiliType 字段 | 完全实现 |
| 内功提供技能槽位 | `kungfu.js` slots 字段, `gameLogic.js:134-151` slotCapacity | 完全实现 |
| 可装备3个内功 (槽位叠加) | `gameLogic.js:339` 上限检查, `slotCapacity` 叠加计算 | 完全实现 |
| 催破功法消耗势 | `kungfu.js:29-53` costShi | 完全实现 |
| 护体功法消耗提气 | `kungfu.js:55-71` costTiQi | 完全实现 |
| 访名师 100 威望 | `gameLogic.js:298-326` drawKungFu | 完全实现 |
| 重复获得 +1 等级 | `gameLogic.js:316` itemCounts | 完全实现 |

**当前功法定义** (`data/kungfu.js`):

| 类型 | 名称 | 特性 |
|-----|------|-----|
| 内功 | 混元一气功 | 混元, 槽位 2/2 |
| 内功 | 金刚不坏体 | 金刚, 槽位 1/3 (防御型) |
| 内功 | 纯阳无极功 | 纯阳, 槽位 3/1 (进攻型) |
| 催破 | 太祖长拳 | 2势, 力道+20% 破体+10% |
| 催破 | 太极剑法 | 3势, 力道+10% 破体+40% 破气+20% |
| 催破 | 狮子吼 | 4势, 破气+80% (内伤特化) |
| 护体 | 铁布衫 | 5000提气, 减伤30% |
| 护体 | 凌波微步 | 8000提气, 减伤60% |

---

### 3. 装备系统

| 设计文档 | 实现位置 | 实现状态 |
|---------|---------|---------|
| 武器槽 (力道/破体/破气) | `items.js` weapon 类型 | 完全实现 |
| 护甲槽 (卸力/御体/御气) | `items.js` armor 类型 | 完全实现 |
| 背包存储 | `gameLogic.js:69` player.bag | 完全实现 |
| 淘装备 100 金钱 | `gameLogic.js:524-551` drawEquipment | 完全实现 |

**装备品阶** (`items.js`):
```
1-凡品, 2-良品, 3-上品, 4-极品, 5-绝世
```

---

### 4. 产业系统

| 设计文档 | 实现位置 | 实现状态 |
|---------|---------|---------|
| 市集产出金钱 (等级×100) | `gameLogic.js:481` | 完全实现 |
| 祠堂产出威望 (等级×10) | `gameLogic.js:482` | 完全实现 |
| 市集升级 (等级×500 金钱) | `gameLogic.js:504` | 完全实现 |
| 祠堂升级 (等级×50 威望) | `gameLogic.js:513` | 完全实现 |
| 运转周天触发月产 | `gameLogic.js:467-498` meditate | 完全实现 |
| 新手礼包 1000金钱+1000威望 | `gameLogic.js:243-248` | 完全实现 |

---

### 5. 战斗系统

#### 战斗流程 (`gameLogic.js:661-992`)

```
prepareCombat() → 生成敌人 → phase='prep'
     ↓
startFighting() → phase='active' → combatLoop()
     ↓
每回合: 提气+1200 → 玩家攻击 → 检查胜负 → 敌人攻击 → 检查胜负
     ↓
endCombat() → phase='result' → 生成战报
```

#### 命中判定 (`gameLogic.js:803-808`)

| 条件 | 公式 | 实现 |
|-----|------|-----|
| 力道 > 卸力 | 命中率 = 力道/卸力 | 完全实现 |
| 力道 ≤ 卸力 | 命中率 = (力道/卸力)/2 | 完全实现 |

#### 伤害计算 (`gameLogic.js:833-846`)

```
外伤 = 9 × 外伤比例 × (破体/御体) × 衰减(破体/御体)
内伤 = 9 × 内伤比例 × (破气/御气) × 衰减(破气/御气)
衰减(x) = 12.51 / (12.51 + x)
总伤害 = 外伤 + 内伤
```

#### 受伤标记 (`gameLogic.js:856-867`)

- 累计伤害 ≥ 200 → +1 标记
- 12 标记 = 失败

#### 战斗资源 (`gameLogic.js:17-19`)

| 资源 | 上限 | 获取 | 实现 |
|-----|-----|------|-----|
| 势 (Shi) | 无上限 | 普通攻击命中+1 | `gameLogic.js:827-829` |
| 提气 (TiQi) | 30000 | 每秒+1200 | `gameLogic.js:750` |

---

### 6. 界面系统

| 设计文档 | 实现位置 | 实现状态 |
|---------|---------|---------|
| 顶部状态栏 (2行) | `App.vue` .top-status | 完全实现 |
| 中央日志区 | `App.vue` .log-area | 完全实现 |
| 底部抽屉 (折叠式) | `App.vue` .drawer | 完全实现 |
| 战报弹窗 | `App.vue` .battle-report-modal | 完全实现 |
| 深色主题 #1a1a1a | `App.vue` style | 完全实现 |
| 3存档槽位 | `storage.js`, `App.vue` menu-view | 完全实现 |
| 全屏战斗界面 (prep/active/result) | `CombatView.vue` | 完全实现 |

---

## 开发指南

### 添加新功法

1. 在 `data/kungfu.js` 添加定义:
```javascript
'new_kungfu_id': {
  id: 'new_kungfu_id',
  type: 'internal' | 'destruction' | 'protection',
  name: '功法名称',
  // 内功需要:
  neiliType: '混元',
  slots: { destruction: 2, protection: 2 },
  // 催破需要:
  costShi: 2,
  bonuses: { power: 0.2 },
  // 护体需要:
  costTiQi: 5000,
  effect: { damageReduction: 0.3 }
}
```

### 添加新装备

1. 在 `data/items.js` 添加定义:
```javascript
'new_item_id': {
  id: 'new_item_id',
  name: '装备名称',
  type: 'weapon' | 'armor',
  rarity: 1-5,
  stats: {
    // 武器: power, penetration, qiBreach
    // 护甲: parry, resistance, qiGuard
  }
}
```

### 测试

```bash
cd wuxia-game
npm run test           # 运行所有测试
npm run test -- -t "estate"  # 运行特定测试
```

关键测试文件:
- `tests/gameLogic.test.js` - 核心逻辑
- `tests/estate.test.js` - 产业系统
- `tests/combatLogs.test.js` - 战斗日志
- `tests/qiAllocation.test.js` - 真气分配
- `tests/storage.test.js` - 存档迁移

### 存档结构 (v2)

```javascript
{
  meta: { version: 2 },
  slots: [
    {
      player: { /* 完整角色状态 */ },
      logs: [ /* 日志记录 */ ],
      battleReports: [ /* 战报 */ ],
      lastPlayed: timestamp
    },
    null,  // 空槽位
    null
  ]
}
```

---

## 待实现功能 (设计文档中提及但未完整实现)

1. **紫霞/玄阴/归元内功** - 内力类型定义已有，但缺少对应内功功法
2. **更多催破/护体功法** - 可扩展功法池
3. **装备强化系统** - itemCounts 已预留等级字段
4. **敌人技能系统** - 敌人目前只有普攻

---

## 代码规范

- 使用中文变量名/注释增强可读性
- 游戏术语保持一致 (势/提气/真气/威望/金钱)
- Vue 组件使用 `<script setup>` 语法
- 测试覆盖核心游戏逻辑
