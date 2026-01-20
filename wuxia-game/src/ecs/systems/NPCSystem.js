/**
 * NPCSystem - NPC管理系统
 * 处理NPC的生成、AI行为、日常活动
 */
import { EntityFactory } from '../entities/EntityFactory.js'

export class NPCSystem {
  constructor() {
    this.world = null
    this.npcPool = new Map() // NPC池，存储所有创建的NPC
  }

  /**
   * 生成随机对手
   * @param {number} playerQi - 玩家真气（用于匹配难度）
   * @param {Object} options - 额外选项
   */
  generateOpponent(playerQi = 80, options = {}) {
    const npc = EntityFactory.createRandomOpponent(playerQi)

    // 使用功法系统配置功法
    const kungfuSystem = this.world?.getSystem('kungfu')
    if (kungfuSystem) {
      const level = Math.max(1, Math.floor((playerQi - 60) / 40) + 1)
      kungfuSystem.randomizeForNPC(npc, level)
    }

    // 使用装备系统配置装备
    const gearSystem = this.world?.getSystem('gear')
    if (gearSystem) {
      const level = Math.max(1, Math.floor((playerQi - 60) / 40) + 1)
      gearSystem.randomizeForNPC(npc, level)
    }

    // 使用真气系统配置真气分配
    const qiSystem = this.world?.getSystem('qi')
    if (qiSystem) {
      const ai = npc.getComponent('AI')
      const preference = ai?.behavior === 'aggressive' ? 'aggressive'
        : ai?.behavior === 'defensive' ? 'defensive'
          : 'balanced'
      qiSystem.randomAllocate(npc, preference)
    }

    // 添加到世界
    if (this.world) {
      this.world.addEntity(npc)
    }

    // 存入NPC池
    this.npcPool.set(npc.id, npc)

    return npc
  }

  /**
   * 生成预设NPC
   * @param {string} presetId - 预设ID
   */
  generatePresetNPC(presetId) {
    const npc = EntityFactory.createPresetNPC(presetId)

    // 配置功法
    const kungfuSystem = this.world?.getSystem('kungfu')
    if (kungfuSystem) {
      kungfuSystem.randomizeForNPC(npc, this.getNPCLevel(npc))
    }

    // 配置装备
    const gearSystem = this.world?.getSystem('gear')
    if (gearSystem) {
      gearSystem.randomizeForNPC(npc, this.getNPCLevel(npc))
    }

    // 配置真气
    const qiSystem = this.world?.getSystem('qi')
    if (qiSystem) {
      const ai = npc.getComponent('AI')
      qiSystem.randomAllocate(npc, ai?.behavior || 'balanced')
    }

    if (this.world) {
      this.world.addEntity(npc)
    }

    this.npcPool.set(npc.id, npc)

    return npc
  }

  /**
   * 获取NPC等级（基于真气）
   * @param {Entity} npc - NPC实体
   */
  getNPCLevel(npc) {
    const qi = npc.getComponent('Qi')
    if (!qi) return 1
    return Math.max(1, Math.floor((qi.qi - 60) / 40) + 1)
  }

  /**
   * 获取NPC描述信息
   * @param {Entity} npc - NPC实体
   */
  getNPCDescription(npc) {
    const identity = npc.getComponent('Identity')
    const qi = npc.getComponent('Qi')
    const ai = npc.getComponent('AI')

    let description = identity?.name || '无名氏'

    if (identity?.title) {
      description = `${identity.title} ${description}`
    }

    if (identity?.faction) {
      description += ` (${identity.faction})`
    }

    const level = this.getNPCLevel(npc)
    const levelNames = ['', '初入江湖', '小有名气', '声名鹊起', '威震一方', '天下闻名']
    if (level > 0 && level < levelNames.length) {
      description += ` - ${levelNames[level]}`
    }

    return description
  }

  /**
   * 获取NPC战斗准备信息
   * @param {Entity} npc - NPC实体
   */
  getNPCCombatInfo(npc) {
    const attributeSystem = this.world?.getSystem('attribute')
    if (!attributeSystem) return null

    const stats = attributeSystem.calculateEffectiveStats(npc)
    const identity = npc.getComponent('Identity')
    const kungfu = npc.getComponent('Kungfu')
    const gear = npc.getComponent('Gear')

    return {
      name: identity?.name || '对手',
      title: identity?.title || '',
      faction: identity?.faction || '',
      level: this.getNPCLevel(npc),
      stats,
      kungfu: {
        activeInternal: kungfu?.activeInternalId,
        destruction: kungfu?.equipment.destruction || [],
        protection: kungfu?.equipment.protection || [],
      },
      gear: {
        weapon: gear?.gear.weapon,
        armor: gear?.gear.armor,
      },
    }
  }

  /**
   * NPC执行日常活动（每月调用）
   * @param {Entity} npc - NPC实体
   */
  performDailyActivity(npc) {
    const activities = []

    // NPC也会修炼，增加真气
    const qiSystem = this.world?.getSystem('qi')
    if (qiSystem && Math.random() < 0.3) {
      qiSystem.increaseQi(npc, 1)
      activities.push('修炼')
    }

    // NPC可能重新分配真气
    if (qiSystem && Math.random() < 0.1) {
      const ai = npc.getComponent('AI')
      qiSystem.randomAllocate(npc, ai?.behavior || 'balanced')
      activities.push('调息')
    }

    return activities
  }

  /**
   * 更新所有NPC（每月调用）
   */
  updateAllNPCs() {
    const npcs = this.world?.getAllNPCs() || []
    const results = []

    for (const npc of npcs) {
      const activities = this.performDailyActivity(npc)
      if (activities.length > 0) {
        results.push({
          npc: npc.getComponent('Identity')?.name,
          activities,
        })
      }
    }

    return results
  }

  /**
   * 移除NPC
   * @param {string} npcId - NPC ID
   */
  removeNPC(npcId) {
    this.npcPool.delete(npcId)
    if (this.world) {
      this.world.removeEntity(npcId)
    }
  }

  /**
   * 清空所有NPC
   */
  clearAllNPCs() {
    for (const npcId of this.npcPool.keys()) {
      if (this.world) {
        this.world.removeEntity(npcId)
      }
    }
    this.npcPool.clear()
  }

  /**
   * 获取所有NPC
   */
  getAllNPCs() {
    return Array.from(this.npcPool.values())
  }

  /**
   * 获取NPC数量
   */
  getNPCCount() {
    return this.npcPool.size
  }

  /**
   * 更新系统
   */
  update() {
    // NPC系统可以在这里处理自动行为
  }
}
