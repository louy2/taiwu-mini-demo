export const ITEM_DEFINITIONS = {
  // Weapons
  'w_iron_sword': {
    id: 'w_iron_sword',
    name: '铁剑',
    type: 'weapon',
    rarity: 1,
    stats: { power: 5, penetration: 5 }
  },
  'w_steel_blade': {
    id: 'w_steel_blade',
    name: '精钢刀',
    type: 'weapon',
    rarity: 2,
    stats: { power: 10, penetration: 8, qiBreach: 5 }
  },
  'w_heavy_sword': {
    id: 'w_heavy_sword',
    name: '玄铁重剑',
    type: 'weapon',
    rarity: 3,
    stats: { power: 20, penetration: 15, qiBreach: 10 }
  },
  'w_divine_rapier': {
    id: 'w_divine_rapier',
    name: '倚天剑',
    type: 'weapon',
    rarity: 4,
    stats: { power: 35, penetration: 25, qiBreach: 20 }
  },
  'w_dragon_saber': {
    id: 'w_dragon_saber',
    name: '屠龙刀',
    type: 'weapon',
    rarity: 5,
    stats: { power: 50, penetration: 40, qiBreach: 30 }
  },

  // Armor
  'a_cloth_robe': {
    id: 'a_cloth_robe',
    name: '布衣',
    type: 'armor',
    rarity: 1,
    stats: { parry: 5, resistance: 5 }
  },
  'a_leather_armor': {
    id: 'a_leather_armor',
    name: '皮甲',
    type: 'armor',
    rarity: 2,
    stats: { parry: 10, resistance: 8, qiGuard: 5 }
  },
  'a_chainmail': {
    id: 'a_chainmail',
    name: '锁子甲',
    type: 'armor',
    rarity: 3,
    stats: { parry: 20, resistance: 15, qiGuard: 10 }
  },
  'a_golden_vest': {
    id: 'a_golden_vest',
    name: '金丝软甲',
    type: 'armor',
    rarity: 4,
    stats: { parry: 35, resistance: 25, qiGuard: 20 }
  },
  'a_heavenly_robe': {
    id: 'a_heavenly_robe',
    name: '天蚕宝衣',
    type: 'armor',
    rarity: 5,
    stats: { parry: 50, resistance: 40, qiGuard: 30 }
  }
};

export const RARITY_NAMES = {
  1: '凡品',
  2: '良品',
  3: '上品',
  4: '极品',
  5: '绝世'
};

// 装备列表（数组形式，供ECS系统使用）
export const itemList = Object.values(ITEM_DEFINITIONS);
