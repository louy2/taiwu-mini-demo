
import { startCombat, resolvePlayerAttack, state, initGlobal, createSaveInSlot, NEILI_TYPES } from './wuxia-game/src/gameLogic.js';

// Mock localStorage
global.localStorage = {
  getItem: () => JSON.stringify({ meta: { version: 2 }, slots: [null, null, null] }),
  setItem: () => {},
};

initGlobal();
createSaveInSlot(0);

// Force resources to 0 so no skills can be used (Normal Attack only)
state.player.resources.shi = 0;
state.player.resources.tiqi = 0;
state.player.equipment.destruction = []; // No skills equipped

const pStats = {
      name: "Player",
      power: 100,
      parry: 10, // Ensure hit
      penetration: 100,
      resistance: 100,
      qiBreach: 100,
      qiGuard: 100,
      internalRatio: 0
};

const eStats = {
    name: "Enemy",
    power: 10,
    parry: 10,
    penetration: 10,
    resistance: 10,
    qiBreach: 10,
    qiGuard: 10,
    internalRatio: 0
};

// Reset logs
state.combatState.currentBattleLogs = [];

resolvePlayerAttack(pStats, eStats);

console.log("Normal Attack Logs:");
state.combatState.currentBattleLogs.forEach(l => console.log(l.text));
