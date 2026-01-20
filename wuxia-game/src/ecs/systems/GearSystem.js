/**
 * GearSystem - 装备系统
 * 处理装备获取、穿戴
 */
import { itemList } from '../../data/items.js'

export class GearSystem {
  constructor() {
    this.world = null
  }

  /**
   * 获取物品数据
   * @param {string} id - 物品ID
   */
  getItem(id) {
    return itemList.find(i => i.id === id)
  }

  /**
   * 获取所有物品
   */
  getAllItems() {
    return itemList
  }

  /**
   * 获取指定类型的所有物品
   * @param {string} type - 物品类型 ('weapon' | 'armor')
   */
  getItemsByType(type) {
    return itemList.filter(i => i.type === type)
  }

  /**
   * 根据稀有度权重随机抽取装备
   * 稀有度1最常见，稀有度5最稀有
   */
  drawRandomItem() {
    // 计算权重（稀有度越高，权重越低）
    const weights = itemList.map(item => {
      return Math.pow(0.4, item.rarity - 1) // 1:1, 2:0.4, 3:0.16, 4:0.064, 5:0.0256
    })

    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight

    for (let i = 0; i < itemList.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return itemList[i]
      }
    }

    return itemList[0] // fallback
  }

  /**
   * 添加装备到背包
   * @param {Entity} entity - 实体
   * @param {string} itemId - 物品ID
   */
  addToBag(entity, itemId) {
    const gear = entity.getComponent('Gear')
    if (!gear) return false

    if (!gear.bag.includes(itemId)) {
      gear.bag.push(itemId)
      gear.itemCounts[itemId] = 1
    } else {
      gear.itemCounts[itemId] = (gear.itemCounts[itemId] || 1) + 1
    }

    return true
  }

  /**
   * 装备武器
   * @param {Entity} entity - 实体
   * @param {string} itemId - 物品ID
   */
  equipWeapon(entity, itemId) {
    const gear = entity.getComponent('Gear')
    if (!gear) return false

    const item = this.getItem(itemId)
    if (!item || item.type !== 'weapon') return false

    // 检查背包中是否有该物品
    if (!gear.bag.includes(itemId)) return false

    // 如果已有装备，先卸下
    const oldWeapon = gear.gear.weapon
    if (oldWeapon) {
      this.addToBag(entity, oldWeapon)
    }

    // 从背包移除并装备
    const index = gear.bag.indexOf(itemId)
    gear.bag.splice(index, 1)
    gear.gear.weapon = itemId

    return true
  }

  /**
   * 卸下武器
   * @param {Entity} entity - 实体
   */
  unequipWeapon(entity) {
    const gear = entity.getComponent('Gear')
    if (!gear || !gear.gear.weapon) return false

    this.addToBag(entity, gear.gear.weapon)
    gear.gear.weapon = null

    return true
  }

  /**
   * 装备护甲
   * @param {Entity} entity - 实体
   * @param {string} itemId - 物品ID
   */
  equipArmor(entity, itemId) {
    const gear = entity.getComponent('Gear')
    if (!gear) return false

    const item = this.getItem(itemId)
    if (!item || item.type !== 'armor') return false

    if (!gear.bag.includes(itemId)) return false

    const oldArmor = gear.gear.armor
    if (oldArmor) {
      this.addToBag(entity, oldArmor)
    }

    const index = gear.bag.indexOf(itemId)
    gear.bag.splice(index, 1)
    gear.gear.armor = itemId

    return true
  }

  /**
   * 卸下护甲
   * @param {Entity} entity - 实体
   */
  unequipArmor(entity) {
    const gear = entity.getComponent('Gear')
    if (!gear || !gear.gear.armor) return false

    this.addToBag(entity, gear.gear.armor)
    gear.gear.armor = null

    return true
  }

  /**
   * 获取装备信息摘要
   * @param {Entity} entity - 实体
   */
  getGearSummary(entity) {
    const gear = entity.getComponent('Gear')
    if (!gear) return null

    return {
      weapon: gear.gear.weapon ? this.getItem(gear.gear.weapon) : null,
      armor: gear.gear.armor ? this.getItem(gear.gear.armor) : null,
      bag: gear.bag.map(id => ({
        item: this.getItem(id),
        count: gear.itemCounts[id] || 1,
      })),
    }
  }

  /**
   * 为NPC随机配置装备
   * @param {Entity} entity - 实体
   * @param {number} level - NPC等级（影响装备品质）
   */
  randomizeForNPC(entity, level = 1) {
    const gear = entity.getComponent('Gear')
    if (!gear) return

    // 清空当前装备
    gear.gear.weapon = null
    gear.gear.armor = null
    gear.bag = []
    gear.itemCounts = {}

    // 根据等级决定最小稀有度
    const minRarity = Math.min(level, 3) // 最低1，最高3

    const weapons = this.getItemsByType('weapon').filter(i => i.rarity >= minRarity)
    const armors = this.getItemsByType('armor').filter(i => i.rarity >= minRarity)

    // 随机选择武器
    if (weapons.length > 0 && Math.random() < 0.7 + level * 0.1) {
      const weapon = weapons[Math.floor(Math.random() * weapons.length)]
      gear.gear.weapon = weapon.id
    }

    // 随机选择护甲
    if (armors.length > 0 && Math.random() < 0.5 + level * 0.1) {
      const armor = armors[Math.floor(Math.random() * armors.length)]
      gear.gear.armor = armor.id
    }
  }

  /**
   * 更新系统
   */
  update() {
    // 装备系统是事件驱动的，不需要每帧更新
  }
}
