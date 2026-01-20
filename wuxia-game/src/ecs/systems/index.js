/**
 * ECS Systems - 系统层入口
 */

export { AttributeSystem, NEILI_TYPES, QI_ALLOCATION_TYPES } from './AttributeSystem.js'
export { CombatSystem, COMBAT_CONSTANTS } from './CombatSystem.js'
export { QiSystem, QI_CONSTANTS } from './QiSystem.js'
export { EstateSystem, ESTATE_CONSTANTS } from './EstateSystem.js'
export { KungfuSystem, KUNGFU_CONSTANTS } from './KungfuSystem.js'
export { GearSystem } from './GearSystem.js'
export { NPCSystem } from './NPCSystem.js'

/**
 * 创建并注册所有系统到世界
 * @param {World} world - 世界实例
 */
export function registerAllSystems(world) {
  const { AttributeSystem } = require('./AttributeSystem.js')
  const { CombatSystem } = require('./CombatSystem.js')
  const { QiSystem } = require('./QiSystem.js')
  const { EstateSystem } = require('./EstateSystem.js')
  const { KungfuSystem } = require('./KungfuSystem.js')
  const { GearSystem } = require('./GearSystem.js')
  const { NPCSystem } = require('./NPCSystem.js')

  world.registerSystem('attribute', new AttributeSystem())
  world.registerSystem('combat', new CombatSystem())
  world.registerSystem('qi', new QiSystem())
  world.registerSystem('estate', new EstateSystem())
  world.registerSystem('kungfu', new KungfuSystem())
  world.registerSystem('gear', new GearSystem())
  world.registerSystem('npc', new NPCSystem())

  return world
}
