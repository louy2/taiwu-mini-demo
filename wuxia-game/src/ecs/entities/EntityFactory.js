/**
 * EntityFactory - 实体工厂
 * 提供创建各种类型实体的便捷方法
 */
import { Entity } from './Entity.js'
import {
  createIdentityComponent,
  createAttributesComponent,
  createQiComponent,
  createKungfuComponent,
  createGearComponent,
  createCombatResourcesComponent,
  createCombatStateComponent,
  createEstateComponent,
  createTimeComponent,
  createAIComponent,
} from '../components/index.js'

// NPC名字池
const NPC_SURNAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '孙', '郑', '马', '朱', '胡', '林', '郭', '何', '高', '罗']
const NPC_NAMES = ['三', '四', '无忌', '翠山', '远桥', '莲舟', '声谷', '岱岩', '空闻', '空智', '空性', '灭绝', '芷若', '敏敏', '青书', '小昭']
const NPC_TITLES = ['', '武林新秀', '江湖散人', '独行侠客', '剑道初成', '拳法精研', '内功小有', '轻功见长']
const NPC_FACTIONS = ['', '武当派', '少林寺', '峨眉派', '华山派', '昆仑派', '崆峒派', '丐帮', '明教']

/**
 * 生成随机NPC名字
 */
function generateNPCName() {
  const surname = NPC_SURNAMES[Math.floor(Math.random() * NPC_SURNAMES.length)]
  const name = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)]
  return surname + name
}

/**
 * 生成随机称号
 */
function generateTitle(level) {
  if (level <= 1) return ''
  const index = Math.min(level, NPC_TITLES.length - 1)
  return NPC_TITLES[index]
}

/**
 * 生成随机门派
 */
function generateFaction() {
  return NPC_FACTIONS[Math.floor(Math.random() * NPC_FACTIONS.length)]
}

export class EntityFactory {
  /**
   * 创建玩家实体
   * @param {Object} data - 玩家数据
   */
  static createPlayer(data = {}) {
    const entity = new Entity(data.id || 'player')

    // 身份组件
    entity.addComponent(createIdentityComponent({
      id: entity.id,
      name: data.name || '太吾传人',
      entityType: 'player',
      title: data.title || '',
      faction: data.faction || '',
    }))

    // 属性组件
    entity.addComponent(createAttributesComponent(data.attributes || {}))

    // 真气组件
    entity.addComponent(createQiComponent(data.qi || {}))

    // 功法组件
    entity.addComponent(createKungfuComponent(data.kungfu || {}))

    // 装备组件
    entity.addComponent(createGearComponent(data.gear || {}))

    // 战斗资源组件
    entity.addComponent(createCombatResourcesComponent(data.combatResources || {}))

    // 战斗状态组件
    entity.addComponent(createCombatStateComponent(data.combatState || {}))

    // 产业组件
    entity.addComponent(createEstateComponent(data.estate || {}))

    // 时间组件
    entity.addComponent(createTimeComponent(data.time || {}))

    return entity
  }

  /**
   * 从旧版本玩家状态创建实体（向后兼容）
   * @param {Object} playerState - 旧版本的玩家状态对象
   */
  static createPlayerFromLegacy(playerState) {
    return EntityFactory.createPlayer({
      id: 'player',
      name: '太吾传人',
      attributes: {
        basePower: playerState.basePower,
        baseFinesse: playerState.baseFinesse,
        baseSwiftness: playerState.baseSwiftness,
        baseInsight: playerState.baseInsight,
        basePenetration: playerState.basePenetration,
        baseQiBreach: playerState.baseQiBreach,
        baseParry: playerState.baseParry,
        baseDismantle: playerState.baseDismantle,
        baseDodge: playerState.baseDodge,
        baseMindGuard: playerState.baseMindGuard,
        baseResistance: playerState.baseResistance,
        baseQiGuard: playerState.baseQiGuard,
      },
      qi: {
        qi: playerState.qi,
        qiDestruction: playerState.qiDestruction,
        qiAgile: playerState.qiAgile,
        qiProtection: playerState.qiProtection,
        qiMeridian: playerState.qiMeridian,
      },
      kungfu: {
        inventory: playerState.inventory,
        equipment: playerState.equipment,
        activeInternalId: playerState.activeInternalId,
      },
      gear: {
        gear: playerState.gear,
        bag: playerState.bag,
        itemCounts: playerState.itemCounts,
      },
      combatResources: playerState.resources,
      estate: {
        money: playerState.money,
        prestige: playerState.prestige,
        marketLevel: playerState.estate?.marketLevel,
        hallLevel: playerState.estate?.hallLevel,
        receivedWelcomeGift: playerState.receivedWelcomeGift,
      },
      time: {
        year: playerState.year,
        month: playerState.month,
      },
    })
  }

  /**
   * 将玩家实体转换为旧版本状态对象（向后兼容）
   * @param {Entity} entity - 玩家实体
   */
  static playerToLegacy(entity) {
    const identity = entity.getComponent('Identity')
    const attributes = entity.getComponent('Attributes')
    const qi = entity.getComponent('Qi')
    const kungfu = entity.getComponent('Kungfu')
    const gear = entity.getComponent('Gear')
    const combatResources = entity.getComponent('CombatResources')
    const estate = entity.getComponent('Estate')
    const time = entity.getComponent('Time')

    return {
      // 属性
      basePower: attributes?.basePower ?? 50,
      baseFinesse: attributes?.baseFinesse ?? 50,
      baseSwiftness: attributes?.baseSwiftness ?? 50,
      baseInsight: attributes?.baseInsight ?? 50,
      basePenetration: attributes?.basePenetration ?? 50,
      baseQiBreach: attributes?.baseQiBreach ?? 50,
      baseParry: attributes?.baseParry ?? 50,
      baseDismantle: attributes?.baseDismantle ?? 50,
      baseDodge: attributes?.baseDodge ?? 50,
      baseMindGuard: attributes?.baseMindGuard ?? 50,
      baseResistance: attributes?.baseResistance ?? 50,
      baseQiGuard: attributes?.baseQiGuard ?? 50,
      // 真气
      qi: qi?.qi ?? 80,
      qiDestruction: qi?.qiDestruction ?? 0,
      qiAgile: qi?.qiAgile ?? 0,
      qiProtection: qi?.qiProtection ?? 0,
      qiMeridian: qi?.qiMeridian ?? 0,
      // 功法
      inventory: kungfu?.inventory ?? [],
      equipment: kungfu?.equipment ?? { internal: [], destruction: [], protection: [] },
      activeInternalId: kungfu?.activeInternalId ?? null,
      // 装备
      gear: gear?.gear ?? { weapon: null, armor: null },
      bag: gear?.bag ?? [],
      itemCounts: gear?.itemCounts ?? {},
      // 战斗资源
      resources: {
        shi: combatResources?.shi ?? 0,
        tiqi: combatResources?.tiqi ?? 0,
      },
      // 产业
      money: estate?.money ?? 0,
      prestige: estate?.prestige ?? 0,
      estate: {
        marketLevel: estate?.marketLevel ?? 1,
        hallLevel: estate?.hallLevel ?? 1,
      },
      receivedWelcomeGift: estate?.receivedWelcomeGift ?? false,
      // 时间
      year: time?.year ?? 1,
      month: time?.month ?? 1,
    }
  }

  /**
   * 创建NPC实体
   * @param {Object} data - NPC数据
   */
  static createNPC(data = {}) {
    const level = data.level ?? 1
    const entity = new Entity(data.id)

    // 身份组件
    entity.addComponent(createIdentityComponent({
      id: entity.id,
      name: data.name || generateNPCName(),
      entityType: 'npc',
      title: data.title || generateTitle(level),
      faction: data.faction || generateFaction(),
    }))

    // 属性组件 - 根据等级调整基础属性
    const baseBonus = (level - 1) * 5
    entity.addComponent(createAttributesComponent({
      basePower: (data.attributes?.basePower ?? 50) + baseBonus,
      baseFinesse: (data.attributes?.baseFinesse ?? 50) + baseBonus,
      baseSwiftness: (data.attributes?.baseSwiftness ?? 50) + baseBonus,
      baseInsight: (data.attributes?.baseInsight ?? 50) + baseBonus,
      basePenetration: (data.attributes?.basePenetration ?? 50) + baseBonus,
      baseQiBreach: (data.attributes?.baseQiBreach ?? 50) + baseBonus,
      baseParry: (data.attributes?.baseParry ?? 50) + baseBonus,
      baseDismantle: (data.attributes?.baseDismantle ?? 50) + baseBonus,
      baseDodge: (data.attributes?.baseDodge ?? 50) + baseBonus,
      baseMindGuard: (data.attributes?.baseMindGuard ?? 50) + baseBonus,
      baseResistance: (data.attributes?.baseResistance ?? 50) + baseBonus,
      baseQiGuard: (data.attributes?.baseQiGuard ?? 50) + baseBonus,
    }))

    // 真气组件 - 根据等级调整
    const qiBonus = (level - 1) * 20
    entity.addComponent(createQiComponent({
      qi: (data.qi?.qi ?? 80) + qiBonus,
      ...data.qi,
    }))

    // 功法组件
    entity.addComponent(createKungfuComponent(data.kungfu || {
      inventory: [],
      equipment: { internal: [], destruction: [], protection: [] },
      activeInternalId: null,
    }))

    // 装备组件
    entity.addComponent(createGearComponent(data.gear || {}))

    // 战斗资源组件
    entity.addComponent(createCombatResourcesComponent(data.combatResources || {}))

    // 战斗状态组件
    entity.addComponent(createCombatStateComponent(data.combatState || {}))

    // AI组件
    entity.addComponent(createAIComponent(data.ai || {
      behavior: data.behavior || 'balanced',
      aggression: data.aggression ?? 0.5,
    }))

    return entity
  }

  /**
   * 创建随机NPC对手
   * @param {number} playerQi - 玩家真气（用于匹配难度）
   */
  static createRandomOpponent(playerQi = 80) {
    // 根据玩家真气计算等级
    const level = Math.max(1, Math.floor((playerQi - 60) / 40) + 1)

    const npc = EntityFactory.createNPC({
      level,
      behavior: ['aggressive', 'defensive', 'balanced'][Math.floor(Math.random() * 3)],
    })

    return npc
  }

  /**
   * 创建预设NPC
   * @param {string} presetId - 预设ID
   */
  static createPresetNPC(presetId) {
    const presets = {
      // 新手村NPC
      'village_guard': {
        name: '村口守卫',
        level: 1,
        title: '',
        faction: '',
        behavior: 'balanced',
      },
      'wandering_swordsman': {
        name: '游侠剑客',
        level: 2,
        title: '江湖散人',
        faction: '',
        behavior: 'aggressive',
      },
      // 门派弟子
      'wudang_disciple': {
        name: '武当弟子',
        level: 2,
        title: '武当派外门弟子',
        faction: '武当派',
        behavior: 'defensive',
      },
      'shaolin_monk': {
        name: '少林僧人',
        level: 3,
        title: '少林俗家弟子',
        faction: '少林寺',
        behavior: 'balanced',
      },
      // Boss级NPC
      'mountain_bandit_chief': {
        name: '山贼头目',
        level: 4,
        title: '黑风寨寨主',
        faction: '',
        behavior: 'aggressive',
      },
      'mysterious_master': {
        name: '神秘高手',
        level: 5,
        title: '隐世高人',
        faction: '',
        behavior: 'balanced',
      },
    }

    const preset = presets[presetId]
    if (!preset) {
      return EntityFactory.createRandomOpponent()
    }

    return EntityFactory.createNPC(preset)
  }
}
