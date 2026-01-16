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

describe('Game Logic', () => {
  beforeEach(() => {
    resetState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    Math.random = originalMathRandom;
  });

  describe('State Management', () => {
    it('should initialize global state', () => {
      initGlobal();
      expect(globalState.slots).toHaveLength(3);
    });

    it('should create a save in a slot', () => {
      createSaveInSlot(0);
      expect(globalState.slots[0]).not.toBeNull();
      expect(globalState.slots[0].player.name).toBeTruthy();
      expect(state.player.name).toBe(globalState.slots[0].player.name);
    });

    it('should load a slot correctly', () => {
      createSaveInSlot(0);
      // Modify active state to ensure load overwrites it
      state.player.name = 'Changed';

      loadSlot(0);
      expect(state.player.name).toBe(globalState.slots[0].player.name);
    });

    it('should delete a slot', () => {
      createSaveInSlot(0);
      deleteSlot(0);
      expect(globalState.slots[0]).toBeNull();
    });
  });

  describe('Progression & Character', () => {
    it('should calculate effective stats based on Neili Type', () => {
      state.player.basePower = 50;
      state.player.qiDestruction = 10;
      state.player.neiliType = '金刚'; // [10, 16, 4]

      // Power = Base + (QiDest * Multiplier)
      // 50 + (10 * 10) = 150
      expect(effectiveStats.value.power).toBe(150);
    });

    it('should meditate to increase Qi', () => {
      state.player.qi = 100;
      meditate();
      expect(state.player.qi).toBe(101);
    });

    it('should not increase Qi beyond MAX_QI', () => {
      state.player.qi = 280;
      meditate();
      expect(state.player.qi).toBe(280);
    });

    it('should change Neili Type when meditating with Internal KungFu', () => {
      state.player.neiliType = '混元';

      // Mock an Internal KungFu
      const kfId = 'internal_zixia'; // Assume this exists in data or needs mocking.
      // Since we import real KUNGFU_DEFINITIONS, let's pick a real one or mock the import.
      // Checking KUNGFU_DEFINITIONS from 'data/kungfu' via gameLogic.
      // Let's assume standard ones exist. If not, we might need to rely on existing ones.
      // Let's check available keys in KUNGFU_DEFINITIONS if possible, but for now assuming 'internal_zixia' is standard or we pick first available.

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

    it('should allocate Qi correctly', () => {
      state.player.qi = 100;
      state.player.qiDestruction = 0;
      state.player.qiProtection = 0;

      allocateQi('destruction', 1);
      expect(state.player.qiDestruction).toBe(1);

      allocateQi('destruction', -1);
      expect(state.player.qiDestruction).toBe(0);
    });

    it('should enforce slot capacity when equipping', () => {
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

  describe('Combat Logic', () => {
    it('should calculate decay correctly', () => {
      // y = 12.51 / (12.51 + x)
      expect(calculateDecay(0)).toBe(1);
      expect(calculateDecay(12.51)).toBe(0.5);
    });

    it('should initialize combat state', async () => {
      await startCombat();
      expect(state.combatState.inCombat).toBe(true);
      expect(state.combatState.enemy).not.toBeNull();
      // Stop loop (it's async, but startCombat calls combatLoop which awaits... wait, startCombat is async but we don't await the loop forever in test usually unless we break it)
      // Since combatLoop is infinite while inCombat is true, calling startCombat directly in test without breaking the loop will hang if not careful.
      // However, `startCombat` calls `combatLoop()` without await?
      // Checking code: `combatLoop();` is at the end of `startCombat`. It is NOT awaited in `startCombat`.
      // So `startCombat` returns Promise<void> immediately? No, it's async but doesn't await the loop.

      // Correction: The code says `async function startCombat() { ... combatLoop(); }`.
      // It does NOT `await combatLoop()`. So it returns once setup is done and loop starts running in background (promise chain).

      state.combatState.inCombat = false; // Stop the loop
    });

    it('should resolve player attack (Hit)', () => {
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
      // HitRate = 100/10 = 10. Roll 0.5 < 10.
      Math.random = () => 0.5;

      resolvePlayerAttack(attacker, state.combatState.enemy);

      expect(state.combatState.enemyDamagePool).toBeGreaterThan(0);
      // 9 base * 1 (ext) * 1 (ratio) * ~0.55 (decay) ~= 5
    });

    it('should resolve player attack (Miss/Grazed)', () => {
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

    it('should add injury marks when damage exceeds pool', () => {
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

    it('should check end combat condition (Player Wins)', () => {
      state.combatState.inCombat = true;
      state.combatState.enemy = { name: 'Boss' };
      state.combatState.enemyMarks = 12; // Win Condition

      const ended = checkEndCombat();

      expect(ended).toBe(true);
      expect(state.combatState.inCombat).toBe(false);
      expect(state.battleReports[0].result).toBe('胜利');
    });

    it('should check end combat condition (Player Loses)', () => {
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
