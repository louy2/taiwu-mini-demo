# CLAUDE.md - 太吾小游戏开发指南

> 完整游戏设计规格请参阅 [`docs/design.md`](docs/design.md)

## 项目概述

一款受《太吾绘卷》启发的武侠文字游戏 Demo。采用极简夜读 MUD 风格界面，实现了角色养成、功法系统、装备系统、产业经营和回合制战斗。

## 快速命令

```bash
cd wuxia-game
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run test     # 运行测试
npm run test -- -t "关键词"  # 运行特定测试
```

## 代码架构

```
wuxia-game/src/
├── main.js              # Vue 入口
├── App.vue              # 主界面 (菜单/游戏/战斗视图切换)
├── gameLogic.js         # 核心游戏逻辑 (~1000行)
├── components/
│   └── CombatView.vue   # 全屏战斗界面
├── data/
│   ├── kungfu.js        # 功法定义
│   └── items.js         # 装备定义
├── utils/
│   └── storage.js       # 存档管理 (v2 多存档)
└── tests/               # 单元测试
```

### 模块依赖关系

```
App.vue
├── gameLogic.js (核心状态与逻辑)
│   ├── data/kungfu.js
│   ├── data/items.js
│   └── utils/storage.js
└── CombatView.vue (战斗UI)
    └── gameLogic.js (战斗逻辑)
```

## 核心模块速查

### gameLogic.js 关键导出

| 函数/常量 | 用途 |
|----------|------|
| `MAX_QI`, `MAX_TIQI` | 真气/提气上限常量 |
| `NEILI_TYPES` | 内力类型倍率表 (金刚/紫霞/玄阴/纯阳/归元/混元) |
| `QI_ALLOCATION_TYPES` | 真气分配类型效果表 (摧破/轻灵/护体/奇窍) |
| `defaultPlayerState` | 角色初始状态模板 |
| `effectiveStats()` | 计算最终属性 (基础+真气加成+装备) |
| `slotCapacity()` | 计算功法槽位容量 |
| `createSaveInSlot()` | 创建新存档 |
| `meditate()` | 运转周天 (月产+真气增长) |
| `drawKungFu()` | 访名师抽取功法 |
| `drawEquipment()` | 淘装备抽取 |
| `allocateQi*()` | 真气分配系列函数 |
| `prepareCombat()` | 初始化战斗 |
| `combatLoop()` | 战斗主循环 |
| `calculateHitRate()` | 命中率计算 |
| `calculateDamage()` | 伤害计算 |

### 数据文件结构

**kungfu.js** - 功法定义:
```javascript
{
  id: 'kungfu_id',
  type: 'internal' | 'destruction' | 'protection',
  name: '功法名称',
  // 内功专属:
  neiliType: '混元',           // 内力类型
  slots: { destruction: 2, protection: 2 },
  // 催破专属:
  costShi: 2,                  // 消耗势
  bonuses: { power: 0.2 },     // 属性加成比例
  // 护体专属:
  costTiQi: 5000,              // 消耗提气
  effect: { damageReduction: 0.3 }
}
```

**items.js** - 装备定义:
```javascript
{
  id: 'item_id',
  name: '装备名称',
  type: 'weapon' | 'armor',
  rarity: 1-5,  // 1凡品 ~ 5绝世
  stats: {
    // 武器: power, penetration, qiBreach
    // 护甲: parry, resistance, qiGuard
  }
}
```

## 常见开发任务

### 添加新功法

1. 在 `data/kungfu.js` 添加功法对象
2. 确保 `id` 唯一
3. 运行 `npm run test` 验证

### 添加新装备

1. 在 `data/items.js` 添加装备对象
2. 确保 `id` 唯一
3. 抽取概率由 `rarity` 决定

### 修改属性计算

1. 查看 `effectiveStats()` 函数
2. 相关常量: `NEILI_TYPES`, `QI_ALLOCATION_TYPES`
3. 测试: `npm run test -- -t "effectiveStats"`

### 修改战斗逻辑

1. 命中: `calculateHitRate()`
2. 伤害: `calculateDamage()`
3. 流程: `combatLoop()`
4. 测试: `npm run test -- -t "combat"`

### 修改存档结构

1. 查看 `utils/storage.js`
2. 更新 `meta.version` 并添加迁移逻辑
3. 测试: `npm run test -- -t "storage"`

## 测试文件

| 文件 | 覆盖范围 |
|-----|---------|
| `gameLogic.test.js` | 核心逻辑、属性计算 |
| `estate.test.js` | 产业系统、资源产出 |
| `combatLogs.test.js` | 战斗日志格式 |
| `qiAllocation.test.js` | 真气分配 |
| `storage.test.js` | 存档迁移 |

## 游戏术语一致性

| 术语 | 英文标识 | 说明 |
|-----|---------|------|
| 真气 | qi | 角色能量，可分配提升属性 |
| 势 | shi | 战斗资源，普攻命中+1 |
| 提气 | tiqi | 战斗资源，每秒+1200 |
| 金钱 | money | 产业资源，市集产出 |
| 威望 | prestige | 产业资源，祠堂产出 |
| 内功 | internal | 功法类型 |
| 催破 | destruction | 功法类型 (攻击) |
| 护体 | protection | 功法类型 (防御) |

## 代码规范

- Vue 组件使用 `<script setup>` 语法
- 游戏术语使用上表中的英文标识
- 注释使用中文增强可读性
- 测试覆盖核心游戏逻辑
- 提交前运行 `npm run test && npm run build`

## 待实现功能

参考 `docs/design.md` 中已定义但未实现的功能:
- 紫霞/玄阴/归元内功功法
- 更多催破/护体功法
- 装备强化系统
- 敌人技能系统
