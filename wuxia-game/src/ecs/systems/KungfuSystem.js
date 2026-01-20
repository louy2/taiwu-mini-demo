/**
 * KungfuSystem - 功法系统
 * 处理功法获取、装备、升级
 */
import { kungfuList } from '../../data/kungfu.js'

export const KUNGFU_CONSTANTS = {
  MAX_INTERNAL_SLOTS: 3,  // 最多装备3个内功
}

export class KungfuSystem {
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
   * 获取所有功法
   */
  getAllKungfu() {
    return kungfuList
  }

  /**
   * 获取指定类型的所有功法
   * @param {string} type - 功法类型 ('internal' | 'destruction' | 'protection')
   */
  getKungfuByType(type) {
    return kungfuList.filter(k => k.type === type)
  }

  /**
   * 检查实体是否拥有某功法
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  hasKungfu(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false
    return kungfu.inventory.includes(kungfuId)
  }

  /**
   * 添加功法到实体
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  addKungfu(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false

    if (!kungfu.inventory.includes(kungfuId)) {
      kungfu.inventory.push(kungfuId)
    }
    // 如果已有则可以升级（当前版本简化处理）

    return true
  }

  /**
   * 随机抽取功法
   * @returns {Object} 功法数据
   */
  drawRandomKungfu() {
    const randomIndex = Math.floor(Math.random() * kungfuList.length)
    return kungfuList[randomIndex]
  }

  /**
   * 装备内功
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  equipInternal(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false

    const kf = this.getKungfu(kungfuId)
    if (!kf || kf.type !== 'internal') return false

    // 检查是否拥有
    if (!this.hasKungfu(entity, kungfuId)) return false

    // 检查是否已装备
    if (kungfu.equipment.internal.includes(kungfuId)) return false

    // 检查槽位限制
    if (kungfu.equipment.internal.length >= KUNGFU_CONSTANTS.MAX_INTERNAL_SLOTS) return false

    kungfu.equipment.internal.push(kungfuId)

    // 如果是第一个内功，自动激活
    if (!kungfu.activeInternalId) {
      kungfu.activeInternalId = kungfuId
    }

    return true
  }

  /**
   * 卸下内功
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  unequipInternal(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false

    const index = kungfu.equipment.internal.indexOf(kungfuId)
    if (index === -1) return false

    kungfu.equipment.internal.splice(index, 1)

    // 如果卸下的是激活的内功，重新选择
    if (kungfu.activeInternalId === kungfuId) {
      kungfu.activeInternalId = kungfu.equipment.internal[0] || null
    }

    // 同时卸下超出槽位的催破和护体功法
    this.validateEquippedSkills(entity)

    return true
  }

  /**
   * 激活内功
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  activateInternal(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false

    // 检查是否已装备
    if (!kungfu.equipment.internal.includes(kungfuId)) return false

    kungfu.activeInternalId = kungfuId
    return true
  }

  /**
   * 获取当前槽位容量
   * @param {Entity} entity - 实体
   */
  getSlotCapacity(entity) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return { destruction: 0, protection: 0 }

    let destruction = 0
    let protection = 0

    for (const id of kungfu.equipment.internal) {
      const internal = this.getKungfu(id)
      if (internal?.slots) {
        destruction += internal.slots.destruction || 0
        protection += internal.slots.protection || 0
      }
    }

    return { destruction, protection }
  }

  /**
   * 装备催破功法
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  equipDestruction(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false

    const kf = this.getKungfu(kungfuId)
    if (!kf || kf.type !== 'destruction') return false

    if (!this.hasKungfu(entity, kungfuId)) return false
    if (kungfu.equipment.destruction.includes(kungfuId)) return false

    const capacity = this.getSlotCapacity(entity)
    if (kungfu.equipment.destruction.length >= capacity.destruction) return false

    kungfu.equipment.destruction.push(kungfuId)
    return true
  }

  /**
   * 卸下催破功法
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  unequipDestruction(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false

    const index = kungfu.equipment.destruction.indexOf(kungfuId)
    if (index === -1) return false

    kungfu.equipment.destruction.splice(index, 1)
    return true
  }

  /**
   * 装备护体功法
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  equipProtection(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false

    const kf = this.getKungfu(kungfuId)
    if (!kf || kf.type !== 'protection') return false

    if (!this.hasKungfu(entity, kungfuId)) return false
    if (kungfu.equipment.protection.includes(kungfuId)) return false

    const capacity = this.getSlotCapacity(entity)
    if (kungfu.equipment.protection.length >= capacity.protection) return false

    kungfu.equipment.protection.push(kungfuId)
    return true
  }

  /**
   * 卸下护体功法
   * @param {Entity} entity - 实体
   * @param {string} kungfuId - 功法ID
   */
  unequipProtection(entity, kungfuId) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return false

    const index = kungfu.equipment.protection.indexOf(kungfuId)
    if (index === -1) return false

    kungfu.equipment.protection.splice(index, 1)
    return true
  }

  /**
   * 验证并调整已装备的技能（确保不超过槽位）
   * @param {Entity} entity - 实体
   */
  validateEquippedSkills(entity) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return

    const capacity = this.getSlotCapacity(entity)

    // 移除超出槽位的催破功法
    while (kungfu.equipment.destruction.length > capacity.destruction) {
      kungfu.equipment.destruction.pop()
    }

    // 移除超出槽位的护体功法
    while (kungfu.equipment.protection.length > capacity.protection) {
      kungfu.equipment.protection.pop()
    }
  }

  /**
   * 获取实体的功法信息摘要
   * @param {Entity} entity - 实体
   */
  getKungfuSummary(entity) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return null

    const capacity = this.getSlotCapacity(entity)

    return {
      inventory: kungfu.inventory.map(id => this.getKungfu(id)),
      equippedInternal: kungfu.equipment.internal.map(id => this.getKungfu(id)),
      equippedDestruction: kungfu.equipment.destruction.map(id => this.getKungfu(id)),
      equippedProtection: kungfu.equipment.protection.map(id => this.getKungfu(id)),
      activeInternal: kungfu.activeInternalId ? this.getKungfu(kungfu.activeInternalId) : null,
      slotCapacity: capacity,
    }
  }

  /**
   * 为NPC随机配置功法
   * @param {Entity} entity - 实体
   * @param {number} level - NPC等级（影响功法数量）
   */
  randomizeForNPC(entity, level = 1) {
    const kungfu = entity.getComponent('Kungfu')
    if (!kungfu) return

    // 清空当前功法
    kungfu.inventory = []
    kungfu.equipment.internal = []
    kungfu.equipment.destruction = []
    kungfu.equipment.protection = []
    kungfu.activeInternalId = null

    // 获取各类功法
    const internals = this.getKungfuByType('internal')
    const destructions = this.getKungfuByType('destruction')
    const protections = this.getKungfuByType('protection')

    // 随机选择1个内功
    if (internals.length > 0) {
      const internal = internals[Math.floor(Math.random() * internals.length)]
      kungfu.inventory.push(internal.id)
      kungfu.equipment.internal.push(internal.id)
      kungfu.activeInternalId = internal.id
    }

    // 根据等级添加催破功法
    const numDestruction = Math.min(level, destructions.length, this.getSlotCapacity(entity).destruction)
    const shuffledDest = [...destructions].sort(() => Math.random() - 0.5)
    for (let i = 0; i < numDestruction; i++) {
      kungfu.inventory.push(shuffledDest[i].id)
      kungfu.equipment.destruction.push(shuffledDest[i].id)
    }

    // 根据等级添加护体功法
    const numProtection = Math.min(Math.ceil(level / 2), protections.length, this.getSlotCapacity(entity).protection)
    const shuffledProt = [...protections].sort(() => Math.random() - 0.5)
    for (let i = 0; i < numProtection; i++) {
      kungfu.inventory.push(shuffledProt[i].id)
      kungfu.equipment.protection.push(shuffledProt[i].id)
    }
  }

  /**
   * 更新系统
   */
  update() {
    // 功法系统是事件驱动的，不需要每帧更新
  }
}
