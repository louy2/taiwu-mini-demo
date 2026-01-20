/**
 * AttributeSystem - 属性计算系统
 * 负责计算实体的有效属性（基础属性 + 真气加成 + 装备加成）
 */
import { kungfuList } from '../../data/kungfu.js'
import { itemList } from '../../data/items.js'

// 内力类型倍率表
export const NEILI_TYPES = {
  金刚: [5, 2, 2, 3, 8, 2],
  紫霞: [2, 3, 5, 2, 3, 7],
  玄阴: [2, 2, 3, 5, 2, 8],
  纯阳: [3, 3, 3, 3, 5, 5],
  归元: [3, 5, 2, 2, 7, 3],
  混元: [3, 3, 3, 3, 5, 5],
}

// 真气分配效果表
export const QI_ALLOCATION_TYPES = {
  摧破: { attack: [1, 6, 3, 3, 1, 1], defense: [0, 0, 0, 0, 0, 0] },
  轻灵: { attack: [6, 3, 1, 3, 3, 6], defense: [3, 6, 1, 3, 3, 6] },
  护体: { attack: [0, 0, 0, 0, 0, 0], defense: [1, 3, 6, 3, 1, 1] },
  奇窍: { attack: [3, 1, 6, 3, 6, 3], defense: [6, 1, 3, 3, 6, 3] },
}

// 属性索引映射
const ATTR_INDEX = {
  power: 0, parry: 0,
  finesse: 1, dismantle: 1,
  swiftness: 2, dodge: 2,
  insight: 3, mindGuard: 3,
  penetration: 4, resistance: 4,
  qiBreach: 5, qiGuard: 5,
}

export class AttributeSystem {
  constructor() {
    this.world = null
  }

  /**
   * 获取功法数据
   * @param {string} id - 功法ID
   */
  getKungfu(id) {
    return kungfuList.find(k => k.id === id)
  }

  /**
   * 获取物品数据
   * @param {string} id - 物品ID
   */
  getItem(id) {
    return itemList.find(i => i.id === id)
  }

  /**
   * 获取实体当前的内力类型
   * @param {Entity} entity - 实体
   */
  getNeiliType(entity) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu || !kungfu.activeInternalId) {
      return '混元' // 默认内力类型
    }
    const internal = this.getKungfu(kungfu.activeInternalId)
    return internal?.neiliType || '混元'
  }

  /**
   * 计算实体的有效属性
   * @param {Entity} entity - 实体
   * @returns {Object} 有效属性对象
   */
  calculateEffectiveStats(entity) {
    const attributes = entity.getComponent('Attributes')
    const qi = entity.getComponent('Qi')
    const kungfu = entity.getComponent('Kungfu')
    const gear = entity.getComponent('Gear')

    if (!attributes) {
      return null
    }

    // 获取内力类型倍率
    const neiliType = this.getNeiliType(entity)
    const neiliMultipliers = NEILI_TYPES[neiliType] || NEILI_TYPES['混元']

    // 计算真气加成
    const qiBonus = this.calculateQiBonus(qi, neiliMultipliers)

    // 计算装备加成
    const gearBonus = this.calculateGearBonus(gear)

    // 计算催破功法加成
    const kungfuBonus = this.calculateKungfuBonus(kungfu)

    // 汇总最终属性
    return {
      // 攻击属性
      power: attributes.basePower + qiBonus.power + gearBonus.power + kungfuBonus.power,
      finesse: attributes.baseFinesse + qiBonus.finesse + gearBonus.finesse + kungfuBonus.finesse,
      swiftness: attributes.baseSwiftness + qiBonus.swiftness + gearBonus.swiftness + kungfuBonus.swiftness,
      insight: attributes.baseInsight + qiBonus.insight + gearBonus.insight + kungfuBonus.insight,
      penetration: attributes.basePenetration + qiBonus.penetration + gearBonus.penetration + kungfuBonus.penetration,
      qiBreach: attributes.baseQiBreach + qiBonus.qiBreach + gearBonus.qiBreach + kungfuBonus.qiBreach,
      // 防御属性
      parry: attributes.baseParry + qiBonus.parry + gearBonus.parry,
      dismantle: attributes.baseDismantle + qiBonus.dismantle + gearBonus.dismantle,
      dodge: attributes.baseDodge + qiBonus.dodge + gearBonus.dodge,
      mindGuard: attributes.baseMindGuard + qiBonus.mindGuard + gearBonus.mindGuard,
      resistance: attributes.baseResistance + qiBonus.resistance + gearBonus.resistance,
      qiGuard: attributes.baseQiGuard + qiBonus.qiGuard + gearBonus.qiGuard,
      // 元信息
      neiliType,
      qiUsed: qi ? (qi.qiDestruction + qi.qiAgile + qi.qiProtection + qi.qiMeridian) : 0,
      qiTotal: qi?.qi || 0,
    }
  }

  /**
   * 计算真气加成
   * @param {Object} qi - 真气组件
   * @param {Array} neiliMultipliers - 内力倍率
   */
  calculateQiBonus(qi, neiliMultipliers) {
    const bonus = {
      power: 0, finesse: 0, swiftness: 0, insight: 0, penetration: 0, qiBreach: 0,
      parry: 0, dismantle: 0, dodge: 0, mindGuard: 0, resistance: 0, qiGuard: 0,
    }

    if (!qi) return bonus

    const attackAttrs = ['power', 'finesse', 'swiftness', 'insight', 'penetration', 'qiBreach']
    const defenseAttrs = ['parry', 'dismantle', 'dodge', 'mindGuard', 'resistance', 'qiGuard']

    // 攻击属性加成
    for (let i = 0; i < 6; i++) {
      const qiAllocationSum =
        qi.qiDestruction * QI_ALLOCATION_TYPES['摧破'].attack[i] +
        qi.qiAgile * QI_ALLOCATION_TYPES['轻灵'].attack[i] +
        qi.qiMeridian * QI_ALLOCATION_TYPES['奇窍'].attack[i]
      bonus[attackAttrs[i]] = neiliMultipliers[i] * qiAllocationSum
    }

    // 防御属性加成
    for (let i = 0; i < 6; i++) {
      const qiAllocationSum =
        qi.qiAgile * QI_ALLOCATION_TYPES['轻灵'].defense[i] +
        qi.qiProtection * QI_ALLOCATION_TYPES['护体'].defense[i] +
        qi.qiMeridian * QI_ALLOCATION_TYPES['奇窍'].defense[i]
      bonus[defenseAttrs[i]] = neiliMultipliers[i] * qiAllocationSum
    }

    return bonus
  }

  /**
   * 计算装备加成
   * @param {Object} gear - 装备组件
   */
  calculateGearBonus(gear) {
    const bonus = {
      power: 0, finesse: 0, swiftness: 0, insight: 0, penetration: 0, qiBreach: 0,
      parry: 0, dismantle: 0, dodge: 0, mindGuard: 0, resistance: 0, qiGuard: 0,
    }

    if (!gear?.gear) return bonus

    // 武器加成
    if (gear.gear.weapon) {
      const weapon = this.getItem(gear.gear.weapon)
      if (weapon?.stats) {
        bonus.power += weapon.stats.power || 0
        bonus.finesse += weapon.stats.finesse || 0
        bonus.swiftness += weapon.stats.swiftness || 0
        bonus.insight += weapon.stats.insight || 0
        bonus.penetration += weapon.stats.penetration || 0
        bonus.qiBreach += weapon.stats.qiBreach || 0
      }
    }

    // 护甲加成
    if (gear.gear.armor) {
      const armor = this.getItem(gear.gear.armor)
      if (armor?.stats) {
        bonus.parry += armor.stats.parry || 0
        bonus.dismantle += armor.stats.dismantle || 0
        bonus.dodge += armor.stats.dodge || 0
        bonus.mindGuard += armor.stats.mindGuard || 0
        bonus.resistance += armor.stats.resistance || 0
        bonus.qiGuard += armor.stats.qiGuard || 0
      }
    }

    return bonus
  }

  /**
   * 计算功法加成（催破功法的被动加成）
   * @param {Object} kungfu - 功法组件
   */
  calculateKungfuBonus(kungfu) {
    const bonus = {
      power: 0, finesse: 0, swiftness: 0, insight: 0, penetration: 0, qiBreach: 0,
    }

    // 当前版本催破功法不提供被动加成，只在战斗中使用
    return bonus
  }

  /**
   * 计算功法槽位容量
   * @param {Entity} entity - 实体
   */
  calculateSlotCapacity(entity) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) {
      return { destruction: 0, protection: 0 }
    }

    let destruction = 0
    let protection = 0

    for (const internalId of kungfu.equipment.internal) {
      const internal = this.getKungfu(internalId)
      if (internal?.slots) {
        destruction += internal.slots.destruction || 0
        protection += internal.slots.protection || 0
      }
    }

    return { destruction, protection }
  }

  /**
   * 更新系统（每帧调用）
   */
  update() {
    // 属性系统是被动计算的，不需要主动更新
  }
}
