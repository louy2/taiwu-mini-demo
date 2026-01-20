/**
 * GameBridge - ECS架构与现有游戏逻辑的桥接层
 *
 * 提供统一的接口，让游戏可以同时使用ECS系统和旧有逻辑
 * 主要用于NPC管理和未来的扩展
 */
import { World } from './World.js'
import { EntityFactory } from './entities/EntityFactory.js'
import { AttributeSystem } from './systems/AttributeSystem.js'
import { CombatSystem, COMBAT_CONSTANTS } from './systems/CombatSystem.js'
import { QiSystem, QI_CONSTANTS } from './systems/QiSystem.js'
import { EstateSystem, ESTATE_CONSTANTS } from './systems/EstateSystem.js'
import { KungfuSystem } from './systems/KungfuSystem.js'
import { GearSystem } from './systems/GearSystem.js'
import { NPCSystem } from './systems/NPCSystem.js'

/**
 * GameBridge 类 - 管理ECS世界和系统
 */
export class GameBridge {
  constructor() {
    this.world = new World()
    this.playerEntity = null
    this.currentOpponent = null

    // 注册所有系统
    this._registerSystems()
  }

  _registerSystems() {
    this.world.registerSystem('attribute', new AttributeSystem())
    this.world.registerSystem('combat', new CombatSystem())
    this.world.registerSystem('qi', new QiSystem())
    this.world.registerSystem('estate', new EstateSystem())
    this.world.registerSystem('kungfu', new KungfuSystem())
    this.world.registerSystem('gear', new GearSystem())
    this.world.registerSystem('npc', new NPCSystem())
  }

  /**
   * 获取系统
   * @param {string} name - 系统名称
   */
  getSystem(name) {
    return this.world.getSystem(name)
  }

  // ==================== 玩家管理 ====================

  /**
   * 从旧版玩家状态创建玩家实体
   * @param {Object} playerState - 旧版玩家状态
   */
  createPlayerFromLegacy(playerState) {
    this.playerEntity = EntityFactory.createPlayerFromLegacy(playerState)
    this.world.addEntity(this.playerEntity)
    return this.playerEntity
  }

  /**
   * 将玩家实体转换为旧版状态
   */
  playerToLegacy() {
    if (!this.playerEntity) return null
    return EntityFactory.playerToLegacy(this.playerEntity)
  }

  /**
   * 获取玩家实体
   */
  getPlayer() {
    return this.playerEntity
  }

  /**
   * 计算玩家有效属性
   */
  calculatePlayerStats() {
    const attributeSystem = this.getSystem('attribute')
    return attributeSystem.calculateEffectiveStats(this.playerEntity)
  }

  // ==================== NPC管理 ====================

  /**
   * 生成随机对手
   * @param {number} playerQi - 玩家真气（用于匹配难度）
   */
  generateOpponent(playerQi = 80) {
    const npcSystem = this.getSystem('npc')
    this.currentOpponent = npcSystem.generateOpponent(playerQi)
    return this.currentOpponent
  }

  /**
   * 生成预设NPC
   * @param {string} presetId - 预设ID
   */
  generatePresetNPC(presetId) {
    const npcSystem = this.getSystem('npc')
    return npcSystem.generatePresetNPC(presetId)
  }

  /**
   * 获取NPC信息
   * @param {Entity} npc - NPC实体
   */
  getNPCInfo(npc) {
    const npcSystem = this.getSystem('npc')
    return {
      description: npcSystem.getNPCDescription(npc),
      combatInfo: npcSystem.getNPCCombatInfo(npc),
    }
  }

  /**
   * 获取当前对手
   */
  getCurrentOpponent() {
    return this.currentOpponent
  }

  /**
   * 将NPC转换为旧版敌人格式（兼容现有战斗系统）
   * @param {Entity} npc - NPC实体
   */
  npcToLegacyEnemy(npc) {
    const attributeSystem = this.getSystem('attribute')
    const stats = attributeSystem.calculateEffectiveStats(npc)
    const identity = npc.getComponent('Identity')
    const combatState = npc.getComponent('CombatState')

    return {
      name: identity?.name || '对手',
      neiliType: stats?.neiliType || '混元',
      power: stats?.power || 50,
      parry: stats?.parry || 50,
      finesse: stats?.finesse || 50,
      dismantle: stats?.dismantle || 50,
      swiftness: stats?.swiftness || 50,
      dodge: stats?.dodge || 50,
      insight: stats?.insight || 50,
      mindGuard: stats?.mindGuard || 50,
      penetration: stats?.penetration || 50,
      resistance: stats?.resistance || 50,
      qiBreach: stats?.qiBreach || 50,
      qiGuard: stats?.qiGuard || 50,
      internalRatio: combatState?.internalRatio ?? Math.floor(Math.random() * 100),
    }
  }

  // ==================== 战斗管理（ECS原生） ====================

  /**
   * 准备ECS战斗
   * @param {Entity} attacker - 进攻方
   * @param {Entity} defender - 防守方
   */
  prepareCombatECS(attacker, defender) {
    const combatSystem = this.getSystem('combat')
    const attributeSystem = this.getSystem('attribute')
    return combatSystem.prepareCombat(attacker, defender, attributeSystem)
  }

  /**
   * 开始ECS战斗
   */
  startCombatECS() {
    const combatSystem = this.getSystem('combat')
    return combatSystem.startCombat()
  }

  /**
   * 执行一回合ECS战斗
   */
  executeRoundECS() {
    const combatSystem = this.getSystem('combat')
    return combatSystem.executeRound()
  }

  /**
   * 快速完成ECS战斗
   */
  quickCombatECS() {
    const combatSystem = this.getSystem('combat')
    return combatSystem.quickCombat()
  }

  /**
   * 获取战斗日志
   */
  getCombatLogs() {
    const combatSystem = this.getSystem('combat')
    return combatSystem.getCombatLogs()
  }

  // ==================== 月度更新 ====================

  /**
   * 月度更新（更新所有NPC）
   */
  monthlyUpdate() {
    const npcSystem = this.getSystem('npc')
    return npcSystem.updateAllNPCs()
  }

  // ==================== 存档管理 ====================

  /**
   * 序列化世界状态
   */
  serialize() {
    return this.world.serialize()
  }

  /**
   * 从序列化数据恢复
   * @param {Object} data - 序列化数据
   */
  deserialize(data) {
    this.world.deserialize(data)
    this.playerEntity = this.world.getPlayer()
    return this
  }

  /**
   * 重置世界
   */
  reset() {
    this.world.clear()
    this.playerEntity = null
    this.currentOpponent = null
  }
}

// 全局桥接实例
let bridgeInstance = null

export function getGameBridge() {
  if (!bridgeInstance) {
    bridgeInstance = new GameBridge()
  }
  return bridgeInstance
}

export function resetGameBridge() {
  if (bridgeInstance) {
    bridgeInstance.reset()
  }
  bridgeInstance = new GameBridge()
  return bridgeInstance
}

// 导出常量供外部使用
export { COMBAT_CONSTANTS, QI_CONSTANTS, ESTATE_CONSTANTS }
