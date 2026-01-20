/**
 * CombatSystem - 战斗系统
 * 处理战斗逻辑、伤害计算、技能施放
 */
import { kungfuList } from '../../data/kungfu.js'

// 战斗常量
export const COMBAT_CONSTANTS = {
  MAX_TIQI: 30000,           // 提气上限
  TIQI_REGEN: 1200,          // 每秒提气恢复
  MAX_WOUND_MARKS: 12,       // 最大受伤标记（失败条件）
  DAMAGE_PER_MARK: 200,      // 每个标记需要的伤害
  BASE_DAMAGE: 9,            // 基础伤害
  DECAY_CONSTANT: 12.51,     // 伤害衰减常数
}

export class CombatSystem {
  constructor() {
    this.world = null
    this.combatState = null  // 当前战斗状态
    this.combatLogs = []     // 战斗日志
    this.onLogCallback = null // 日志回调
  }

  /**
   * 设置日志回调
   * @param {Function} callback - 日志回调函数
   */
  setLogCallback(callback) {
    this.onLogCallback = callback
  }

  /**
   * 添加战斗日志
   * @param {string} message - 日志消息
   * @param {string} type - 日志类型
   */
  log(message, type = 'info') {
    const logEntry = { message, type, timestamp: Date.now() }
    this.combatLogs.push(logEntry)
    if (this.onLogCallback) {
      this.onLogCallback(logEntry)
    }
  }

  /**
   * 获取功法数据
   * @param {string} id - 功法ID
   */
  getKungfu(id) {
    return kungfuList.find(k => k.id === id)
  }

  /**
   * 准备战斗
   * @param {Entity} attacker - 进攻方实体
   * @param {Entity} defender - 防守方实体
   * @param {Object} attributeSystem - 属性系统引用
   */
  prepareCombat(attacker, defender, attributeSystem) {
    // 重置战斗状态
    this.combatLogs = []

    // 获取双方有效属性
    const attackerStats = attributeSystem.calculateEffectiveStats(attacker)
    const defenderStats = attributeSystem.calculateEffectiveStats(defender)

    // 重置双方战斗资源
    const attackerResources = attacker.getComponent('CombatResources')
    const defenderResources = defender.getComponent('CombatResources')
    const attackerCombat = attacker.getComponent('CombatState')
    const defenderCombat = defender.getComponent('CombatState')

    if (attackerResources) {
      attackerResources.shi = 0
      attackerResources.tiqi = 0
    }
    if (defenderResources) {
      defenderResources.shi = 0
      defenderResources.tiqi = 0
    }
    if (attackerCombat) {
      attackerCombat.damagePool = 0
      attackerCombat.woundMarks = 0
      attackerCombat.isInCombat = true
    }
    if (defenderCombat) {
      defenderCombat.damagePool = 0
      defenderCombat.woundMarks = 0
      defenderCombat.isInCombat = true
    }

    this.combatState = {
      phase: 'prep',
      attacker: {
        entity: attacker,
        stats: attackerStats,
        name: attacker.getComponent('Identity')?.name || '玩家',
      },
      defender: {
        entity: defender,
        stats: defenderStats,
        name: defender.getComponent('Identity')?.name || '对手',
      },
      round: 0,
    }

    this.log(`战斗准备: ${this.combatState.attacker.name} vs ${this.combatState.defender.name}`, 'system')

    return this.combatState
  }

  /**
   * 计算命中率
   * @param {number} attackerPower - 进攻方力道
   * @param {number} defenderParry - 防守方卸力
   */
  calculateHitRate(attackerPower, defenderParry) {
    if (attackerPower > defenderParry) {
      return attackerPower / defenderParry
    } else {
      return (attackerPower / defenderParry) / 2
    }
  }

  /**
   * 计算伤害
   * @param {Object} attackerStats - 进攻方属性
   * @param {Object} defenderStats - 防守方属性
   * @param {number} internalRatio - 内伤比例 (0-1)
   * @param {Object} bonuses - 额外加成
   */
  calculateDamage(attackerStats, defenderStats, internalRatio = 0, bonuses = {}) {
    const { BASE_DAMAGE, DECAY_CONSTANT } = COMBAT_CONSTANTS

    // 物理伤害
    const physicalRatio = 1 - internalRatio
    const penetration = (attackerStats.penetration + (bonuses.penetration || 0))
    const resistance = defenderStats.resistance
    const physicalCoeff = penetration / resistance
    const physicalDecay = DECAY_CONSTANT / (DECAY_CONSTANT + physicalCoeff)
    const physicalDamage = BASE_DAMAGE * physicalRatio * physicalCoeff * physicalDecay

    // 内伤
    const qiBreach = (attackerStats.qiBreach + (bonuses.qiBreach || 0))
    const qiGuard = defenderStats.qiGuard
    const internalCoeff = qiBreach / qiGuard
    const internalDecay = DECAY_CONSTANT / (DECAY_CONSTANT + internalCoeff)
    const internalDamage = BASE_DAMAGE * internalRatio * internalCoeff * internalDecay

    // 力道加成（可选）
    const powerBonus = bonuses.power ? (1 + bonuses.power) : 1

    return {
      physical: physicalDamage * powerBonus,
      internal: internalDamage * powerBonus,
      total: (physicalDamage + internalDamage) * powerBonus,
    }
  }

  /**
   * 应用伤害减免（护体功法）
   * @param {number} damage - 原始伤害
   * @param {number} reduction - 减免比例 (0-1)
   */
  applyDamageReduction(damage, reduction) {
    return damage * (1 - reduction)
  }

  /**
   * 更新伤害池和受伤标记
   * @param {Entity} entity - 受击实体
   * @param {number} damage - 伤害值
   */
  applyDamage(entity, damage) {
    const combatState = entity.getComponent('CombatState')
    if (!combatState) return { woundMarks: 0, newMarks: 0 }

    combatState.damagePool += damage
    const newMarks = Math.floor(combatState.damagePool / COMBAT_CONSTANTS.DAMAGE_PER_MARK)

    if (newMarks > 0) {
      combatState.woundMarks += newMarks
      combatState.damagePool %= COMBAT_CONSTANTS.DAMAGE_PER_MARK
    }

    return {
      woundMarks: combatState.woundMarks,
      newMarks,
      isDefeated: combatState.woundMarks >= COMBAT_CONSTANTS.MAX_WOUND_MARKS,
    }
  }

  /**
   * 选择并尝试使用催破技能
   * @param {Entity} entity - 实体
   * @param {Object} stats - 实体属性
   */
  tryUseDestructionSkill(entity) {
    const kungfu = entity.getComponent('Kungfu')
    const resources = entity.getComponent('CombatResources')

    if (!kungfu || !resources) return null

    const availableSkills = kungfu.equipment.destruction
      .map(id => this.getKungfu(id))
      .filter(skill => skill && resources.shi >= skill.costShi)

    if (availableSkills.length === 0) return null

    // 随机选择一个可用技能
    const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)]

    // 消耗势
    resources.shi -= skill.costShi

    return skill
  }

  /**
   * 选择并尝试使用护体技能
   * @param {Entity} entity - 实体
   */
  tryUseProtectionSkill(entity) {
    const kungfu = entity.getComponent('Kungfu')
    const resources = entity.getComponent('CombatResources')

    if (!kungfu || !resources) return null

    const availableSkills = kungfu.equipment.protection
      .map(id => this.getKungfu(id))
      .filter(skill => skill && resources.tiqi >= skill.costTiQi)

    if (availableSkills.length === 0) return null

    // 随机选择一个可用技能
    const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)]

    // 消耗提气
    resources.tiqi -= skill.costTiQi

    return skill
  }

  /**
   * 执行一次攻击
   * @param {Object} attacker - 进攻方信息 { entity, stats, name }
   * @param {Object} defender - 防守方信息 { entity, stats, name }
   */
  executeAttack(attacker, defender) {
    const attackerResources = attacker.entity.getComponent('CombatResources')
    const defenderCombat = defender.entity.getComponent('CombatState')

    // 检查是否使用催破技能
    const destructionSkill = this.tryUseDestructionSkill(attacker.entity)
    let bonuses = {}

    if (destructionSkill) {
      this.log(`${attacker.name} 施展「${destructionSkill.name}」！`, 'skill')
      bonuses = destructionSkill.bonuses || {}
    }

    // 计算命中
    const hitRate = this.calculateHitRate(
      attacker.stats.power + (bonuses.power ? attacker.stats.power * bonuses.power : 0),
      defender.stats.parry
    )
    const isHit = Math.random() < hitRate

    if (!isHit) {
      this.log(`${attacker.name} 攻击未能命中`, 'miss')
      return { hit: false, damage: 0 }
    }

    // 普通攻击命中，获得1点势
    if (!destructionSkill && attackerResources) {
      attackerResources.shi += 1
    }

    // 检查防守方是否使用护体技能
    const protectionSkill = this.tryUseProtectionSkill(defender.entity)
    let damageReduction = 0

    if (protectionSkill) {
      this.log(`${defender.name} 施展「${protectionSkill.name}」！`, 'skill')
      damageReduction = protectionSkill.effect?.damageReduction || 0
    }

    // 计算伤害
    const internalRatio = defenderCombat?.internalRatio || 0
    const damageResult = this.calculateDamage(
      attacker.stats,
      defender.stats,
      internalRatio,
      {
        penetration: bonuses.penetration ? attacker.stats.penetration * bonuses.penetration : 0,
        qiBreach: bonuses.qiBreach ? attacker.stats.qiBreach * bonuses.qiBreach : 0,
        power: bonuses.power || 0,
      }
    )

    // 应用伤害减免
    const finalDamage = this.applyDamageReduction(damageResult.total, damageReduction)

    // 应用伤害
    const result = this.applyDamage(defender.entity, finalDamage)

    this.log(
      `${attacker.name} 命中 ${defender.name}，造成 ${finalDamage.toFixed(1)} 点伤害` +
      (result.newMarks > 0 ? `，标记 +${result.newMarks}` : ''),
      'damage'
    )

    return {
      hit: true,
      damage: finalDamage,
      woundMarks: result.woundMarks,
      isDefeated: result.isDefeated,
    }
  }

  /**
   * 执行一回合战斗
   */
  executeRound() {
    if (!this.combatState || this.combatState.phase !== 'active') {
      return null
    }

    this.combatState.round++

    // 双方提气恢复
    const attackerResources = this.combatState.attacker.entity.getComponent('CombatResources')
    const defenderResources = this.combatState.defender.entity.getComponent('CombatResources')

    if (attackerResources) {
      attackerResources.tiqi = Math.min(
        attackerResources.tiqi + COMBAT_CONSTANTS.TIQI_REGEN,
        COMBAT_CONSTANTS.MAX_TIQI
      )
    }
    if (defenderResources) {
      defenderResources.tiqi = Math.min(
        defenderResources.tiqi + COMBAT_CONSTANTS.TIQI_REGEN,
        COMBAT_CONSTANTS.MAX_TIQI
      )
    }

    // 进攻方攻击
    const attackResult = this.executeAttack(this.combatState.attacker, this.combatState.defender)

    if (attackResult.isDefeated) {
      return this.endCombat(this.combatState.attacker.name, 'defeat')
    }

    // 防守方反击
    const counterResult = this.executeAttack(this.combatState.defender, this.combatState.attacker)

    if (counterResult.isDefeated) {
      return this.endCombat(this.combatState.defender.name, 'defeat')
    }

    return {
      phase: 'active',
      round: this.combatState.round,
      attackResult,
      counterResult,
    }
  }

  /**
   * 开始战斗
   */
  startCombat() {
    if (!this.combatState || this.combatState.phase !== 'prep') {
      return null
    }

    this.combatState.phase = 'active'
    this.log('战斗开始！', 'system')

    return this.combatState
  }

  /**
   * 结束战斗
   * @param {string} winnerName - 胜利者名称
   * @param {string} reason - 胜利原因
   */
  endCombat(winnerName, reason) {
    if (!this.combatState) return null

    this.combatState.phase = 'result'
    this.combatState.winner = winnerName
    this.combatState.reason = reason

    // 重置战斗状态
    const attackerCombat = this.combatState.attacker.entity.getComponent('CombatState')
    const defenderCombat = this.combatState.defender.entity.getComponent('CombatState')

    if (attackerCombat) attackerCombat.isInCombat = false
    if (defenderCombat) defenderCombat.isInCombat = false

    this.log(`战斗结束！${winnerName} 获胜！`, 'system')

    return {
      phase: 'result',
      winner: winnerName,
      reason,
      rounds: this.combatState.round,
      logs: [...this.combatLogs],
    }
  }

  /**
   * 快速战斗（一次性完成所有回合）
   * @param {number} maxRounds - 最大回合数
   */
  quickCombat(maxRounds = 100) {
    this.startCombat()

    while (this.combatState.phase === 'active' && this.combatState.round < maxRounds) {
      const result = this.executeRound()
      if (result?.phase === 'result') {
        return result
      }
    }

    // 超过最大回合数，判定平局
    if (this.combatState.phase === 'active') {
      return this.endCombat('无人', 'timeout')
    }

    return this.combatState
  }

  /**
   * 获取当前战斗状态
   */
  getCombatState() {
    return this.combatState
  }

  /**
   * 获取战斗日志
   */
  getCombatLogs() {
    return [...this.combatLogs]
  }

  /**
   * 更新系统
   */
  update() {
    // 战斗系统是事件驱动的，不需要每帧更新
  }
}
