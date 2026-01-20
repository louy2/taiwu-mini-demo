import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    state,
    resetState,
    meditate,
    upgradeBuilding,
    drawEquipment,
    drawKungFu,
    equipItem,
    unequipItem,
    effectiveStats
} from '../gameLogic';
import { ITEM_DEFINITIONS } from '../data/items';
import { KUNGFU_DEFINITIONS } from '../data/kungfu';

// Mock storage to prevent side effects
vi.mock('../utils/storage', () => ({
    loadGlobalData: () => ({ slots: [null, null, null] }),
    saveGlobalData: () => {},
}));

describe('Estate and Economy System', () => {
    beforeEach(() => {
        resetState();
        // Give initial resources to test consumption
        state.player.money = 10000;
        state.player.prestige = 10000;
        state.player.estate = { marketLevel: 1, hallLevel: 1 };
    });

    it('Month Flow (Meditate) generates resources', () => {
        state.player.money = 0;
        state.player.prestige = 0;
        state.player.estate.marketLevel = 2;
        state.player.estate.hallLevel = 3;

        meditate();

        // Market Lv2 = 200, Hall Lv3 = 300
        expect(state.player.money).toBe(200);
        expect(state.player.prestige).toBe(300);
    });

    it('Upgrade Market consumes Money and increases Level', () => {
        state.player.money = 1000;
        state.player.estate.marketLevel = 1;

        // Cost = Lv * 500 = 500
        upgradeBuilding('market');

        expect(state.player.estate.marketLevel).toBe(2);
        expect(state.player.money).toBe(500);
    });

    it('Upgrade Hall consumes Prestige and increases Level', () => {
        state.player.prestige = 500;
        state.player.estate.hallLevel = 1;

        // Cost = Lv * 500 = 500
        upgradeBuilding('hall');

        expect(state.player.estate.hallLevel).toBe(2);
        expect(state.player.prestige).toBe(0);
    });

    it('Upgrade fails if not enough currency', () => {
        state.player.money = 0;
        state.player.estate.marketLevel = 1;

        upgradeBuilding('market');

        expect(state.player.estate.marketLevel).toBe(1);
    });
});

describe('Gacha and Equipment System', () => {
    beforeEach(() => {
        resetState();
        state.player.money = 5000;
        state.player.prestige = 5000;
        state.player.bag = [];
        state.player.inventory = [];
    });

    it('Draw Equipment consumes Money and adds item to bag', () => {
        const initialMoney = state.player.money;

        drawEquipment();

        expect(state.player.money).toBe(initialMoney - 100);
        expect(state.player.bag.length).toBe(1);

        const itemId = state.player.bag[0];
        expect(ITEM_DEFINITIONS[itemId]).toBeDefined();
    });

    it('Draw KungFu consumes Prestige and adds to inventory', () => {
        const initialPrestige = state.player.prestige;
        const initialCount = state.player.inventory.length;

        drawKungFu();

        expect(state.player.prestige).toBe(initialPrestige - 100);
        expect(state.player.inventory.length).toBe(initialCount + 1);

        // Check if last added is valid kungfu
        const kfId = state.player.inventory[state.player.inventory.length - 1];
        expect(KUNGFU_DEFINITIONS[kfId]).toBeDefined();
    });

    it('Equipping item applies stats', () => {
        // Manually add specific items
        const weaponId = 'w_iron_sword'; // Power +5, Pen +5
        const armorId = 'a_cloth_robe';  // Parry +5, Res +5

        state.player.bag = [weaponId, armorId];

        // Base Stats
        const basePower = state.player.basePower; // 50
        const baseParry = state.player.baseParry; // 50

        // Equip Weapon
        equipItem(weaponId);

        expect(state.player.gear.weapon).toBe(weaponId);
        expect(state.player.bag).not.toContain(weaponId);

        // Check Stats
        // Effective stats includes gear
        // Power = Base 50 + Gear 5 = 55
        // (Assuming 0 Qi assigned)
        const statsWithWeapon = effectiveStats.value;
        // Note: multipliers apply to Qi, not base+gear?
        // Logic: power = p.basePower + (qi * mult) + gear.
        // Let's check gameLogic impl.
        // Logic: stats.power += w.power
        expect(statsWithWeapon.power).toBe(basePower + 5);
        expect(statsWithWeapon.penetration).toBe(state.player.basePenetration + 5);

        // Equip Armor
        equipItem(armorId);
        const statsFull = effectiveStats.value;
        expect(statsFull.parry).toBe(baseParry + 5);
        expect(statsFull.resistance).toBe(state.player.baseResistance + 5);
    });

    it('Unequip item returns it to bag and removes stats', () => {
        const weaponId = 'w_iron_sword';
        state.player.gear.weapon = weaponId;
        state.player.bag = [];

        unequipItem('weapon');

        expect(state.player.gear.weapon).toBeNull();
        expect(state.player.bag).toContain(weaponId);

        const stats = effectiveStats.value;
        // Should be back to base
        // Need to account for random init in createSave? No, resetState uses default fixed?
        // defaultPlayerState uses 50 for all.
        expect(stats.power).toBe(50);
    });
});
