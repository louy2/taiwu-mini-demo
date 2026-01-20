/**
 * ECS Components - 纯数据容器
 * 每个组件定义一个数据结构，不包含逻辑
 */

/**
 * 身份组件 - 标识实体的基本信息
 */
export function createIdentityComponent(data = {}) {
  return {
    type: 'Identity',
    id: data.id || `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: data.name || '无名氏',
    entityType: data.entityType || 'npc', // 'player' | 'npc'
    title: data.title || '',  // 称号
    faction: data.faction || '', // 门派
  }
}

/**
 * 属性组件 - 12组基础属性
 */
export function createAttributesComponent(data = {}) {
  const randomBase = () => 50 + Math.floor(Math.random() * 11) // 50-60
  return {
    type: 'Attributes',
    // 攻击属性
    basePower: data.basePower ?? randomBase(),       // 力道
    baseFinesse: data.baseFinesse ?? randomBase(),   // 精妙
    baseSwiftness: data.baseSwiftness ?? randomBase(), // 迅疾
    baseInsight: data.baseInsight ?? randomBase(),   // 动心
    basePenetration: data.basePenetration ?? randomBase(), // 破体
    baseQiBreach: data.baseQiBreach ?? randomBase(), // 破气
    // 防御属性
    baseParry: data.baseParry ?? randomBase(),       // 卸力
    baseDismantle: data.baseDismantle ?? randomBase(), // 拆招
    baseDodge: data.baseDodge ?? randomBase(),       // 闪避
    baseMindGuard: data.baseMindGuard ?? randomBase(), // 守心
    baseResistance: data.baseResistance ?? randomBase(), // 御体
    baseQiGuard: data.baseQiGuard ?? randomBase(),   // 御气
  }
}

/**
 * 真气组件 - 真气系统
 */
export function createQiComponent(data = {}) {
  return {
    type: 'Qi',
    qi: data.qi ?? 80,              // 真气总量
    qiDestruction: data.qiDestruction ?? 0,  // 摧破分配
    qiAgile: data.qiAgile ?? 0,              // 轻灵分配
    qiProtection: data.qiProtection ?? 0,    // 护体分配
    qiMeridian: data.qiMeridian ?? 0,        // 奇窍分配
  }
}

/**
 * 功法组件 - 功法系统
 */
export function createKungfuComponent(data = {}) {
  return {
    type: 'Kungfu',
    inventory: data.inventory || ['internal_hunyuan', 'dest_longfist', 'prot_ironshirt'], // 拥有的功法ID
    equipment: data.equipment || {
      internal: [],      // 装备的内功（最多3个）
      destruction: [],   // 装备的催破功法
      protection: [],    // 装备的护体功法
    },
    activeInternalId: data.activeInternalId || null, // 当前运转的内功ID
  }
}

/**
 * 装备组件 - 装备系统
 */
export function createGearComponent(data = {}) {
  return {
    type: 'Gear',
    gear: data.gear || {
      weapon: null,   // 装备的武器ID
      armor: null,    // 装备的护甲ID
    },
    bag: data.bag || [],           // 背包中的装备ID
    itemCounts: data.itemCounts || {}, // 重复装备计数
  }
}

/**
 * 战斗资源组件 - 战斗中的资源
 */
export function createCombatResourcesComponent(data = {}) {
  return {
    type: 'CombatResources',
    shi: data.shi ?? 0,     // 势
    tiqi: data.tiqi ?? 0,   // 提气
  }
}

/**
 * 战斗状态组件 - 战斗中的状态
 */
export function createCombatStateComponent(data = {}) {
  return {
    type: 'CombatState',
    damagePool: data.damagePool ?? 0,      // 伤害池
    woundMarks: data.woundMarks ?? 0,      // 受伤标记
    isInCombat: data.isInCombat ?? false,  // 是否在战斗中
    internalRatio: data.internalRatio ?? 0, // 内伤比例
  }
}

/**
 * 产业组件 - 产业系统（主要用于玩家）
 */
export function createEstateComponent(data = {}) {
  return {
    type: 'Estate',
    money: data.money ?? 0,           // 金钱
    prestige: data.prestige ?? 0,     // 威望
    marketLevel: data.marketLevel ?? 1, // 市集等级
    hallLevel: data.hallLevel ?? 1,    // 祠堂等级
    receivedWelcomeGift: data.receivedWelcomeGift ?? false,
  }
}

/**
 * 时间组件 - 时间系统
 */
export function createTimeComponent(data = {}) {
  return {
    type: 'Time',
    year: data.year ?? 1,
    month: data.month ?? 1,
  }
}

/**
 * AI组件 - NPC的AI行为
 */
export function createAIComponent(data = {}) {
  return {
    type: 'AI',
    behavior: data.behavior || 'balanced', // 'aggressive' | 'defensive' | 'balanced'
    skillPriority: data.skillPriority || [], // 技能优先级
    aggression: data.aggression ?? 0.5, // 攻击倾向 0-1
  }
}

// 所有组件创建函数的映射
export const ComponentFactories = {
  Identity: createIdentityComponent,
  Attributes: createAttributesComponent,
  Qi: createQiComponent,
  Kungfu: createKungfuComponent,
  Gear: createGearComponent,
  CombatResources: createCombatResourcesComponent,
  CombatState: createCombatStateComponent,
  Estate: createEstateComponent,
  Time: createTimeComponent,
  AI: createAIComponent,
}
