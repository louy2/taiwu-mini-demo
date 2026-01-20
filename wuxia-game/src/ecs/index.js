/**
 * ECS 架构入口
 *
 * 太吾小游戏 ECS (Entity-Component-System) 架构
 *
 * 设计原则:
 * - Entity (实体): 只是一个ID和组件容器，没有逻辑
 * - Component (组件): 纯数据容器，定义实体的某个方面
 * - System (系统): 处理拥有特定组件组合的所有实体的逻辑
 *
 * 核心优势:
 * 1. 玩家和NPC使用相同的组件结构，可以参与同样的系统
 * 2. 易于扩展新功能（只需添加新组件和系统）
 * 3. 数据和逻辑分离，便于存档和调试
 */

// 世界管理器
export { World, getWorld, resetWorld } from './World.js'

// 组件
export * from './components/index.js'

// 实体
export * from './entities/index.js'

// 系统
export * from './systems/index.js'

// 便捷函数：创建并初始化一个完整的游戏世界
export function createGameWorld() {
  const { World } = require('./World.js')
  const { AttributeSystem } = require('./systems/AttributeSystem.js')
  const { CombatSystem } = require('./systems/CombatSystem.js')
  const { QiSystem } = require('./systems/QiSystem.js')
  const { EstateSystem } = require('./systems/EstateSystem.js')
  const { KungfuSystem } = require('./systems/KungfuSystem.js')
  const { GearSystem } = require('./systems/GearSystem.js')
  const { NPCSystem } = require('./systems/NPCSystem.js')

  const world = new World()

  // 注册所有系统
  world.registerSystem('attribute', new AttributeSystem())
  world.registerSystem('combat', new CombatSystem())
  world.registerSystem('qi', new QiSystem())
  world.registerSystem('estate', new EstateSystem())
  world.registerSystem('kungfu', new KungfuSystem())
  world.registerSystem('gear', new GearSystem())
  world.registerSystem('npc', new NPCSystem())

  return world
}
