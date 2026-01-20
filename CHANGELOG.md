# 变更日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 格式。

## [Unreleased]

### Added
- **ECS架构**: 引入Entity-Component-System架构，实现数据与逻辑分离
  - 10个组件：Identity、Attributes、Qi、Kungfu、Gear、CombatResources、CombatState、Estate、Time、AI
  - 7个系统：AttributeSystem、CombatSystem、QiSystem、KungfuSystem、GearSystem、EstateSystem、NPCSystem
  - World世界管理器和GameBridge桥接层
- **NPC系统**: NPC角色现在与玩家共享相同的组件结构
  - NPC拥有身份信息（名字、称号、门派）
  - NPC等级系统（1-5级，基于真气）
  - AI行为类型（aggressive/defensive/balanced）
  - NPC可以使用功法和装备
  - 预设NPC（村口守卫、武当弟子、少林僧人等）
- **ECS测试**: 新增16个ECS架构单元测试
- 数据文件新增数组导出（kungfuList、itemList）供ECS系统使用

### Changed
- 重构 CLAUDE.md 为开发导向指南，添加ECS架构速查
- 整合 README.md 添加完整项目文档
- 删除过时的英文设计文档
- 更新 design.md 添加ECS架构和NPC系统章节
- 战斗准备阶段改用ECS系统生成NPC对手
- 战斗日志显示NPC的称号和门派信息

---

## 主要版本历史

### 全屏战斗界面
- 实现战斗界面三阶段：准备(prep)、战斗(active)、结算(result)
- 战斗日志实时滚动显示

### 扩展属性系统
- 新增精妙/拆招、迅疾/闪避、动心/守心属性对
- 6组属性均为命中/化解属性

### 多内功系统
- 支持同时装备最多3个内功
- 槽位叠加计算
- 重复功法转为等级提升

### 产业与经济系统
- 市集产出金钱，祠堂产出威望
- 运转周天触发月产
- 淘装备消耗金钱，访名师消耗威望
- 新手礼包：1000金钱 + 1000威望

### 真气分配系统
- 四种分配类型：摧破、轻灵、护体、奇窍
- 一键分配：全部、平均、重置
- 六种内力类型倍率加成

### 界面重设计
- 极简夜读 MUD 风格
- 深色主题 (#1a1a1a)
- 底部抽屉式菜单
- 移动端适配优化

### 战斗系统
- 命中判定：力道 vs 卸力
- 伤害计算：外伤(破体/御体) + 内伤(破气/御气)
- 受伤标记机制：累计200伤害 = 1标记，12标记 = 失败
- 战报系统：保留最近10场详细战报

### 功法系统
- 内功决定内力类型和功法槽位
- 催破功法消耗势，提升攻击
- 护体功法消耗提气，减少伤害

### 存档系统
- 3存档槽位
- 版本迁移支持
- LocalStorage 持久化

### 初始版本
- 基础角色属性
- 回合制战斗框架
- Vue 3 + Vite 项目结构
