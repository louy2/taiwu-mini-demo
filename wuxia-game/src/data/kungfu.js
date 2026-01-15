
export const KUNGFU_DEFINITIONS = {
  // --- INTERNAL (内功) ---
  'internal_hunyuan': {
    id: 'internal_hunyuan',
    type: 'internal',
    name: '混元一气功',
    neiliType: '混元',
    slots: { destruction: 2, protection: 2 },
    desc: '基础内功，中正平和。'
  },
  'internal_vajra': {
    id: 'internal_vajra',
    type: 'internal',
    name: '金刚不坏体',
    neiliType: '金刚',
    slots: { destruction: 1, protection: 3 },
    desc: '佛门正宗，坚不可摧。'
  },
  'internal_pureyang': {
    id: 'internal_pureyang',
    type: 'internal',
    name: '纯阳无极功',
    neiliType: '纯阳',
    slots: { destruction: 3, protection: 1 },
    desc: '道家秘传，至刚至阳。'
  },

  // --- DESTRUCTION (催破) ---
  'dest_longfist': {
    id: 'dest_longfist',
    type: 'destruction',
    name: '太祖长拳',
    costShi: 2,
    bonuses: { power: 0.2, penetration: 0.1 }, // Multiplier +20%
    desc: '势大力沉的一拳。'
  },
  'dest_sword': {
    id: 'dest_sword',
    type: 'destruction',
    name: '太极剑法',
    costShi: 3,
    bonuses: { power: 0.1, penetration: 0.4, qiBreach: 0.2 },
    desc: '以柔克刚，直指破绽。'
  },
  'dest_roar': {
    id: 'dest_roar',
    type: 'destruction',
    name: '狮子吼',
    costShi: 4,
    bonuses: { qiBreach: 0.8 }, // Huge Internal bonus
    desc: '佛门神通，震慑心神。'
  },

  // --- PROTECTION (护体) ---
  'prot_ironshirt': {
    id: 'prot_ironshirt',
    type: 'protection',
    name: '铁布衫',
    costTiQi: 5000,
    effect: { damageReduction: 0.3 }, // Reduce damage by 30%
    desc: '运功护体，刀枪不入。'
  },
  'prot_dodge': {
    id: 'prot_dodge',
    type: 'protection',
    name: '凌波微步',
    costTiQi: 8000,
    effect: { damageReduction: 0.6 },
    desc: '身法玄妙，避实击虚。'
  }
};

export const DEFAULT_INVENTORY = [
  'internal_hunyuan',
  'dest_longfist',
  'prot_ironshirt'
];
