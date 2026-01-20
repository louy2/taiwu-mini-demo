/**
 * EstateSystem - 产业系统
 * 处理建筑升级、资源产出
 */

export const ESTATE_CONSTANTS = {
  MARKET_OUTPUT_PER_LEVEL: 100,  // 市集每级产出金钱
  HALL_OUTPUT_PER_LEVEL: 100,    // 祠堂每级产出威望
  MARKET_UPGRADE_COST_MULT: 500, // 市集升级消耗倍率
  HALL_UPGRADE_COST_MULT: 500,   // 祠堂升级消耗倍率
  WELCOME_GIFT_MONEY: 1000,      // 新手礼包金钱
  WELCOME_GIFT_PRESTIGE: 1000,   // 新手礼包威望
  DRAW_KUNGFU_COST: 100,         // 访名师消耗威望
  DRAW_EQUIPMENT_COST: 100,      // 淘装备消耗金钱
}

export class EstateSystem {
  constructor() {
    this.world = null
  }

  /**
   * 检查并发放新手礼包
   * @param {Entity} entity - 实体
   */
  checkWelcomeGift(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate || estate.receivedWelcomeGift) return false

    estate.money += ESTATE_CONSTANTS.WELCOME_GIFT_MONEY
    estate.prestige += ESTATE_CONSTANTS.WELCOME_GIFT_PRESTIGE
    estate.receivedWelcomeGift = true

    return true
  }

  /**
   * 计算市集产出
   * @param {Entity} entity - 实体
   */
  getMarketOutput(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate) return 0
    return estate.marketLevel * ESTATE_CONSTANTS.MARKET_OUTPUT_PER_LEVEL
  }

  /**
   * 计算祠堂产出
   * @param {Entity} entity - 实体
   */
  getHallOutput(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate) return 0
    return estate.hallLevel * ESTATE_CONSTANTS.HALL_OUTPUT_PER_LEVEL
  }

  /**
   * 产出资源（每月调用）
   * @param {Entity} entity - 实体
   */
  produceResources(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate) return null

    const moneyProduced = this.getMarketOutput(entity)
    const prestigeProduced = this.getHallOutput(entity)

    estate.money += moneyProduced
    estate.prestige += prestigeProduced

    return { money: moneyProduced, prestige: prestigeProduced }
  }

  /**
   * 获取市集升级消耗
   * @param {Entity} entity - 实体
   */
  getMarketUpgradeCost(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate) return Infinity
    return estate.marketLevel * ESTATE_CONSTANTS.MARKET_UPGRADE_COST_MULT
  }

  /**
   * 获取祠堂升级消耗
   * @param {Entity} entity - 实体
   */
  getHallUpgradeCost(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate) return Infinity
    return estate.hallLevel * ESTATE_CONSTANTS.HALL_UPGRADE_COST_MULT
  }

  /**
   * 升级市集
   * @param {Entity} entity - 实体
   */
  upgradeMarket(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate) return false

    const cost = this.getMarketUpgradeCost(entity)
    if (estate.money < cost) return false

    estate.money -= cost
    estate.marketLevel += 1

    return true
  }

  /**
   * 升级祠堂
   * @param {Entity} entity - 实体
   */
  upgradeHall(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate) return false

    const cost = this.getHallUpgradeCost(entity)
    if (estate.prestige < cost) return false

    estate.prestige -= cost
    estate.hallLevel += 1

    return true
  }

  /**
   * 消耗金钱
   * @param {Entity} entity - 实体
   * @param {number} amount - 消耗数量
   */
  spendMoney(entity, amount) {
    const estate = entity.getComponent('Estate')
    if (!estate || estate.money < amount) return false

    estate.money -= amount
    return true
  }

  /**
   * 消耗威望
   * @param {Entity} entity - 实体
   * @param {number} amount - 消耗数量
   */
  spendPrestige(entity, amount) {
    const estate = entity.getComponent('Estate')
    if (!estate || estate.prestige < amount) return false

    estate.prestige -= amount
    return true
  }

  /**
   * 获取资源信息
   * @param {Entity} entity - 实体
   */
  getResourceInfo(entity) {
    const estate = entity.getComponent('Estate')
    if (!estate) return null

    return {
      money: estate.money,
      prestige: estate.prestige,
      marketLevel: estate.marketLevel,
      hallLevel: estate.hallLevel,
      marketOutput: this.getMarketOutput(entity),
      hallOutput: this.getHallOutput(entity),
      marketUpgradeCost: this.getMarketUpgradeCost(entity),
      hallUpgradeCost: this.getHallUpgradeCost(entity),
    }
  }

  /**
   * 更新系统
   */
  update() {
    // 产业系统是事件驱动的，不需要每帧更新
  }
}
