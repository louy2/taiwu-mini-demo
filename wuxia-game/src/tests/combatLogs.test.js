import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  state, resetState, startCombat, resolvePlayerAttack,
  equipKungFu, allocateQi
} from '../gameLogic';
import { KUNGFU_DEFINITIONS } from '../data/kungfu';

// Mock Storage to avoid errors
vi.mock('../utils/storage', () => ({
  loadGlobalData: vi.fn(() => ({ meta: { version: 2 }, slots: [null, null, null] })),
  saveGlobalData: vi.fn()
}));

const originalMathRandom = Math.random;

describe('Combat Logs Verification', () => {
  beforeEach(() => {
    resetState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    Math.random = originalMathRandom;
  });

  it('使用技能时日志应包含技能名称', () => {
    state.combatState.inCombat = true;
    state.combatState.enemy = { parry: 10, resistance: 10, qiGuard: 10, name: 'Dummy' };
    state.player.resources.shi = 100; // Enough Shi

    // Equip a specific destruction skill
    const skillId = 'dest_longfist'; // "太祖长拳"
    const skillName = KUNGFU_DEFINITIONS[skillId].name;

    // We need to equip an internal first to have slots?
    // gameLogic: equipKungFu checks slots.
    // Let's just force push to equipment array for test simplicity
    state.player.equipment.destruction.push(skillId);

    const attacker = { name: 'Hero', power: 100, penetration: 10, qiBreach: 10, internalRatio: 0 };

    // Mock random:
    // 1. Skill check: gameLogic uses randomElem(usableSkills). If only 1, it picks it.
    // 2. Hit check: hitRate calc.
    // 3. Roll < hitRate.

    // We want a HIT with SKILL.
    // resolvePlayerAttack logic:
    // ... finds usable skills ...
    // ... picks one ...
    // ... calculates hitRate ...
    // ... roll = Math.random() ...

    // To ensure hit, we need low roll.
    // But randomElem also uses Math.random().
    // randomElem: arr[Math.floor(Math.random() * arr.length)]

    // If we have 1 skill, randomElem will pick index 0 regardless of random if we handle it right?
    // Math.random() < 1 so index 0.

    // If we mock Math.random to return 0.1:
    // Skill Pick: 0.1 * 1 = 0. Index 0. Correct.
    // Hit Roll: 0.1. If hitRate > 0.1, it hits.
    // 100 vs 10 parry -> Rate > 1. Hit!

    Math.random = () => 0.1;

    resolvePlayerAttack(attacker, state.combatState.enemy);

    const logs = state.combatState.currentBattleLogs;
    const lastLog = logs[logs.length - 1].text;

    expect(lastLog).toContain(`使出一招【${skillName}】`);
  });

  it('普通攻击不应包含“使出一招”描述', () => {
    state.combatState.inCombat = true;
    state.combatState.enemy = { parry: 10, resistance: 10, qiGuard: 10, name: 'Dummy' };
    state.player.resources.shi = 0; // No Shi, so no skills usable

    const attacker = { name: 'Hero', power: 100, penetration: 10, qiBreach: 10, internalRatio: 0 };

    Math.random = () => 0.1; // Hit

    resolvePlayerAttack(attacker, state.combatState.enemy);

    const logs = state.combatState.currentBattleLogs;
    const lastLog = logs[logs.length - 1].text;

    expect(lastLog).not.toContain('使出一招');
    expect(lastLog).toContain('攻击Dummy的');
  });
});
