import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  state, globalState, effectiveStats, slotCapacity,
  resetState, initGlobal, createSaveInSlot, loadSlot, deleteSlot,
  meditate, equipKungFu, unequipKungFu, allocateQi,
  startCombat, resolvePlayerAttack, resolveEnemyAttack, checkEndCombat,
  calculateDecay, NEILI_TYPES
} from '../gameLogic';
import { KUNGFU_DEFINITIONS } from '../data/kungfu';

// Mock Storage
vi.mock('../utils/storage', () => ({
  loadGlobalData: vi.fn(() => ({ meta: { version: 2 }, slots: [null, null, null] })),
  saveGlobalData: vi.fn()
}));

// Mock Random for deterministic combat tests
const originalMathRandom = Math.random;

describe('核心游戏逻辑 (Game Logic)', () => {
  beforeEach(() => {
    resetState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    Math.random = originalMathRandom;
  });

  describe('状态管理 (State Management)', () => {
    it('应初始化全局状态', () => {
      initGlobal();
      expect(globalState.slots).toHaveLength(3);
    });

    it('应在插槽中创建存档', () => {
      createSaveInSlot(0);
      expect(globalState.slots[0]).not.toBeNull();
      expect(globalState.slots[0].player.name).toBeTruthy();
      expect(state.player.name).toBe(globalState.slots[0].player.name);
    });

    it('应正确加载存档', () => {
      createSaveInSlot(0);
      // Modify active state to ensure load overwrites it
      state.player.name = 'Changed';

      loadSlot(0);
      expect(state.player.name).toBe(globalState.slots[0].player.name);
    });

    it('应删除存档', () => {
      createSaveInSlot(0);
      deleteSlot(0);
      expect(globalState.slots[0]).toBeNull();
    });
  });

  describe('角色成长 (Progression & Character)', () => {
    it('应根据内力属性计算有效属性', () => {
      state.player.basePower = 50;
      state.player.qiDestruction = 10;
      state.player.neiliType = '金刚'; // [10, 16, 4]

      // Power = Base + (QiDest * Multiplier)
      // 50 + (10 * 10) = 150
      expect(effectiveStats.value.power).toBe(150);
    });

    it('应通过冥想增加真气', () => {
      state.player.qi = 100;
      meditate();
      expect(state.player.qi).toBe(101);
    });

    it('真气不应超过上限', () => {
      state.player.qi = 280;
      meditate();
      expect(state.player.qi).toBe(280);
    });

    it('装备内功并冥想时应改变内力属性', () => {
      state.player.neiliType = '混元';

      // Mock an Internal KungFu
      const kfId = 'internal_zixia'; // Assume this exists in data or needs mocking.
      // We will look for a key with type 'internal'
      const internalId = Object.keys(KUNGFU_DEFINITIONS).find(k => KUNGFU_DEFINITIONS[k].type === 'internal');
      if (internalId) {
          state.player.equipment.internal = internalId;
          const expectedType = KUNGFU_DEFINITIONS[internalId].neiliType;

          // Force difference
          state.player.neiliType = (expectedType === '金刚') ? '混元' : '金刚';

          meditate();
          expect(state.player.neiliType).toBe(expectedType);
      }
    });

    it('应正确分配真气', () => {
      state.player.qi = 100;
      state.player.qiDestruction = 0;
      state.player.qiProtection = 0;

      allocateQi('destruction', 1);
      expect(state.player.qiDestruction).toBe(1);

      allocateQi('destruction', -1);
      expect(state.player.qiDestruction).toBe(0);
    });

    it('装备功法时应强制检查槽位容量', () => {
        // Need to mock or find an internal KungFu that sets slots
        const internalId = Object.keys(KUNGFU_DEFINITIONS).find(k => KUNGFU_DEFINITIONS[k].type === 'internal');
        if (internalId) {
            equipKungFu(internalId);

            const cap = KUNGFU_DEFINITIONS[internalId].slots;
            const destId = Object.keys(KUNGFU_DEFINITIONS).find(k => KUNGFU_DEFINITIONS[k].type === 'destruction');

            if (destId) {
                // Try to overfill
                for(let i=0; i < cap.destruction + 2; i++) {
                    equipKungFu(destId);
                }
                expect(state.player.equipment.destruction.length).toBeLessThanOrEqual(cap.destruction);
            }
        }
    });
  });

  describe('战斗逻辑 (Combat Logic)', () => {
    it('应正确计算伤害衰减', () => {
      // y = 12.51 / (12.51 + x)
      expect(calculateDecay(0)).toBe(1);
      expect(calculateDecay(12.51)).toBe(0.5);
    });

    it('应正确初始化战斗状态', async () => {
      await startCombat();
      expect(state.combatState.inCombat).toBe(true);
      expect(state.combatState.enemy).not.toBeNull();
      state.combatState.inCombat = false; // Stop the loop
    });

    it('应处理玩家攻击命中', () => {
      // Setup
      state.combatState.inCombat = true;
      state.combatState.enemy = {
        name: 'Dummy',
        parry: 10,
        resistance: 10,
        qiGuard: 10,
        internalRatio: 0 // 100% External
      };
      state.combatState.enemyDamagePool = 0;
      state.combatState.enemyMarks = 0;

      const attacker = {
        name: 'Hero',
        power: 100, // High power guarantees hit if we control random
        penetration: 10, // Ratio 1 -> Decay 0.55
        qiBreach: 10,
        internalRatio: 0
      };

      // Mock Random to ensure hit (roll < hitRate)
      Math.random = () => 0.5;

      resolvePlayerAttack(attacker, state.combatState.enemy);

      expect(state.combatState.enemyDamagePool).toBeGreaterThan(0);
    });

    it('应处理玩家攻击未命中', () => {
       state.combatState.inCombat = true;
       state.combatState.enemy = {
         name: 'Dummy',
         parry: 1000,
         resistance: 10,
         qiGuard: 10
       };

       const attacker = {
         name: 'Hero',
         power: 10,
         penetration: 10,
         qiBreach: 10,
         internalRatio: 0
       };

       // HitRate = 10/1000/2 = 0.005.
       // Roll 0.1 > 0.005 -> Miss
       Math.random = () => 0.1;

       const initialPool = state.combatState.enemyDamagePool;
       resolvePlayerAttack(attacker, state.combatState.enemy);

       expect(state.combatState.enemyDamagePool).toBe(initialPool);
    });

    it('当伤害超过阈值时应增加伤势标记', () => {
       state.combatState.inCombat = true;
       state.combatState.enemy = { parry: 1, resistance: 1, qiGuard: 1 };
       state.combatState.enemyDamagePool = 199;

       const attacker = {
         power: 100, penetration: 100, qiBreach: 100, internalRatio: 0
       };
       // Huge damage to trigger mark

       Math.random = () => 0.1; // Hit

       resolvePlayerAttack(attacker, state.combatState.enemy);

       expect(state.combatState.enemyMarks).toBeGreaterThan(0);
       expect(state.combatState.enemyDamagePool).toBeLessThan(200);
    });

    it('应检查战斗结束条件 (玩家胜利)', () => {
      state.combatState.inCombat = true;
      state.combatState.enemy = { name: 'Boss' };
      state.combatState.enemyMarks = 12; // Win Condition

      const ended = checkEndCombat();

      expect(ended).toBe(true);
      expect(state.combatState.inCombat).toBe(false);
      expect(state.battleReports[0].result).toBe('胜利');
    });

    it('应检查战斗结束条件 (玩家失败)', () => {
        state.combatState.inCombat = true;
        state.combatState.enemy = { name: 'Boss' };
        state.combatState.playerMarks = 12; // Lose Condition

        const ended = checkEndCombat();

        expect(ended).toBe(true);
        expect(state.combatState.inCombat).toBe(false);
        expect(state.battleReports[0].result).toBe('失败');
      });
  });
});
