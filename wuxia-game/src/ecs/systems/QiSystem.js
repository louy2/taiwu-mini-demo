/**
 * QiSystem - 真气系统
 * 处理真气分配、增长
 */

export const QI_CONSTANTS = {
  MAX_QI: 280,      // 真气上限
  INITIAL_QI: 80,   // 初始真气
}

export class QiSystem {
  constructor() {
    this.world = null
  }

  /**
   * 获取实体已使用的真气
   * @param {Entity} entity - 实体
   */
  getUsedQi(entity) {
    const qi = entity.getComponent('Qi')
    if (!qi) return 0
    return qi.qiDestruction + qi.qiAgile + qi.qiProtection + qi.qiMeridian
  }

  /**
   * 获取实体剩余真气
   * @param {Entity} entity - 实体
   */
  getRemainingQi(entity) {
    const qi = entity.getComponent('Qi')
    if (!qi) return 0
    return qi.qi - this.getUsedQi(entity)
  }

  /**
   * 分配真气
   * @param {Entity} entity - 实体
   * @param {string} type - 分配类型 ('destruction' | 'agile' | 'protection' | 'meridian')
   * @param {number} amount - 分配数量（正数增加，负数减少）
   */
  allocateQi(entity, type, amount) {
    const qi = entity.getComponent('Qi')
    if (!qi) return false

    const fieldMap = {
      destruction: 'qiDestruction',
      agile: 'qiAgile',
      protection: 'qiProtection',
      meridian: 'qiMeridian',
    }

    const field = fieldMap[type]
    if (!field) return false

    const remaining = this.getRemainingQi(entity)

    if (amount > 0) {
      // 增加分配
      if (amount > remaining) {
        amount = remaining
      }
      qi[field] += amount
    } else {
      // 减少分配
      const current = qi[field]
      if (-amount > current) {
        amount = -current
      }
      qi[field] += amount
    }

    return true
  }

  /**
   * 将所有剩余真气分配给指定类型
   * @param {Entity} entity - 实体
   * @param {string} type - 分配类型
   */
  allocateAllQi(entity, type) {
    const remaining = this.getRemainingQi(entity)
    if (remaining > 0) {
      return this.allocateQi(entity, type, remaining)
    }
    return false
  }

  /**
   * 平均分配剩余真气
   * @param {Entity} entity - 实体
   */
  allocateEvenly(entity) {
    const remaining = this.getRemainingQi(entity)
    if (remaining <= 0) return false

    const qi = entity.getComponent('Qi')
    if (!qi) return false

    const perType = Math.floor(remaining / 4)
    const remainder = remaining % 4

    qi.qiDestruction += perType
    qi.qiAgile += perType
    qi.qiProtection += perType
    qi.qiMeridian += perType + remainder // 余数给奇窍

    return true
  }

  /**
   * 重置所有真气分配
   * @param {Entity} entity - 实体
   */
  resetAllocation(entity) {
    const qi = entity.getComponent('Qi')
    if (!qi) return false

    qi.qiDestruction = 0
    qi.qiAgile = 0
    qi.qiProtection = 0
    qi.qiMeridian = 0

    return true
  }

  /**
   * 增加真气上限
   * @param {Entity} entity - 实体
   * @param {number} amount - 增加数量
   */
  increaseQi(entity, amount = 1) {
    const qi = entity.getComponent('Qi')
    if (!qi) return false

    qi.qi = Math.min(qi.qi + amount, QI_CONSTANTS.MAX_QI)
    return true
  }

  /**
   * 随机分配真气（用于NPC）
   * @param {Entity} entity - 实体
   * @param {string} preference - 偏好类型 ('aggressive' | 'defensive' | 'balanced')
   */
  randomAllocate(entity, preference = 'balanced') {
    const qi = entity.getComponent('Qi')
    if (!qi) return false

    // 先重置
    this.resetAllocation(entity)

    const total = qi.qi

    switch (preference) {
      case 'aggressive':
        // 攻击偏好：摧破60%，轻灵20%，护体10%，奇窍10%
        qi.qiDestruction = Math.floor(total * 0.6)
        qi.qiAgile = Math.floor(total * 0.2)
        qi.qiProtection = Math.floor(total * 0.1)
        qi.qiMeridian = total - qi.qiDestruction - qi.qiAgile - qi.qiProtection
        break

      case 'defensive':
        // 防御偏好：摧破10%，轻灵20%，护体60%，奇窍10%
        qi.qiDestruction = Math.floor(total * 0.1)
        qi.qiAgile = Math.floor(total * 0.2)
        qi.qiProtection = Math.floor(total * 0.6)
        qi.qiMeridian = total - qi.qiDestruction - qi.qiAgile - qi.qiProtection
        break

      case 'balanced':
      default:
        // 均衡：各25%
        this.allocateEvenly(entity)
        break
    }

    return true
  }

  /**
   * 更新系统
   */
  update() {
    // 真气系统是事件驱动的，不需要每帧更新
  }
}
