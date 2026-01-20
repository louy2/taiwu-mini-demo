import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../ecs/World';
import { Entity } from '../ecs/entities/Entity';
import { EntityFactory } from '../ecs/entities/EntityFactory';
import { AttributeSystem } from '../ecs/systems/AttributeSystem';
import { QiSystem } from '../ecs/systems/QiSystem';
import { KungfuSystem } from '../ecs/systems/KungfuSystem';
import { GearSystem } from '../ecs/systems/GearSystem';
import { NPCSystem } from '../ecs/systems/NPCSystem';
import { CombatSystem } from '../ecs/systems/CombatSystem';
import {
  createIdentityComponent,
  createAttributesComponent,
  createQiComponent,
  createKungfuComponent,
  createGearComponent,
  createCombatResourcesComponent,
  createCombatStateComponent,
} from '../ecs/components/index';

describe('ECS 架构测试', () => {
  let world;
  let attributeSystem;
  let qiSystem;
  let kungfuSystem;
  let gearSystem;
  let npcSystem;

  beforeEach(() => {
    world = new World();
    attributeSystem = new AttributeSystem();
    qiSystem = new QiSystem();
    kungfuSystem = new KungfuSystem();
    gearSystem = new GearSystem();
    npcSystem = new NPCSystem();

    world.registerSystem('attribute', attributeSystem);
    world.registerSystem('qi', qiSystem);
    world.registerSystem('kungfu', kungfuSystem);
    world.registerSystem('gear', gearSystem);
    world.registerSystem('npc', npcSystem);
  });

  describe('Entity 测试', () => {
    it('应正确创建和管理组件', () => {
      const entity = new Entity('test_entity');

      entity.addComponent(createIdentityComponent({ name: '测试角色' }));
      entity.addComponent(createAttributesComponent({ basePower: 60 }));

      expect(entity.hasComponent('Identity')).toBe(true);
      expect(entity.hasComponent('Attributes')).toBe(true);
      expect(entity.getComponent('Identity').name).toBe('测试角色');
      expect(entity.getComponent('Attributes').basePower).toBe(60);
    });

    it('应正确序列化和反序列化实体', () => {
      const entity = new Entity('test_entity');
      entity.addComponent(createIdentityComponent({ name: '测试角色' }));
      entity.addComponent(createQiComponent({ qi: 100 }));

      const serialized = entity.serialize();
      expect(serialized.id).toBe('test_entity');
      expect(serialized.Identity.name).toBe('测试角色');
      expect(serialized.Qi.qi).toBe(100);
    });
  });

  describe('EntityFactory 测试', () => {
    it('应创建玩家实体', () => {
      const player = EntityFactory.createPlayer({ name: '太吾传人' });

      expect(player.hasComponent('Identity')).toBe(true);
      expect(player.hasComponent('Attributes')).toBe(true);
      expect(player.hasComponent('Qi')).toBe(true);
      expect(player.hasComponent('Kungfu')).toBe(true);
      expect(player.hasComponent('Gear')).toBe(true);
      expect(player.hasComponent('Estate')).toBe(true);

      const identity = player.getComponent('Identity');
      expect(identity.entityType).toBe('player');
    });

    it('应创建NPC实体', () => {
      const npc = EntityFactory.createNPC({ name: '张三', level: 2 });

      expect(npc.hasComponent('Identity')).toBe(true);
      expect(npc.hasComponent('Attributes')).toBe(true);
      expect(npc.hasComponent('Qi')).toBe(true);
      expect(npc.hasComponent('AI')).toBe(true);

      const identity = npc.getComponent('Identity');
      expect(identity.entityType).toBe('npc');
      expect(identity.name).toBe('张三');
    });

    it('应创建随机对手', () => {
      const opponent = EntityFactory.createRandomOpponent(100);

      expect(opponent.hasComponent('Identity')).toBe(true);
      expect(opponent.hasComponent('Attributes')).toBe(true);

      const identity = opponent.getComponent('Identity');
      expect(identity.entityType).toBe('npc');
    });
  });

  describe('AttributeSystem 测试', () => {
    it('应计算有效属性', () => {
      const entity = new Entity();
      entity.addComponent(createAttributesComponent({
        basePower: 60,
        baseParry: 55,
        basePenetration: 50,
        baseResistance: 50,
      }));
      entity.addComponent(createQiComponent({ qi: 80 }));
      entity.addComponent(createKungfuComponent());
      entity.addComponent(createGearComponent());

      const stats = attributeSystem.calculateEffectiveStats(entity);

      expect(stats.power).toBeGreaterThanOrEqual(60);
      expect(stats.parry).toBeGreaterThanOrEqual(55);
    });

    it('应正确应用真气加成', () => {
      const entity = new Entity();
      entity.addComponent(createAttributesComponent({ basePower: 50 }));
      entity.addComponent(createQiComponent({
        qi: 80,
        qiDestruction: 20,  // 摧破加成
      }));
      entity.addComponent(createKungfuComponent({
        equipment: { internal: ['internal_hunyuan'], destruction: [], protection: [] },
        activeInternalId: 'internal_hunyuan',
      }));
      entity.addComponent(createGearComponent());

      const stats = attributeSystem.calculateEffectiveStats(entity);

      // 摧破应增加攻击属性
      expect(stats.power).toBeGreaterThan(50);
    });
  });

  describe('QiSystem 测试', () => {
    it('应正确分配真气', () => {
      const entity = new Entity();
      entity.addComponent(createQiComponent({ qi: 80 }));

      qiSystem.allocateQi(entity, 'destruction', 20);
      const qi = entity.getComponent('Qi');

      expect(qi.qiDestruction).toBe(20);
      expect(qiSystem.getRemainingQi(entity)).toBe(60);
    });

    it('应正确平均分配真气', () => {
      const entity = new Entity();
      entity.addComponent(createQiComponent({ qi: 80 }));

      qiSystem.allocateEvenly(entity);
      const qi = entity.getComponent('Qi');

      expect(qi.qiDestruction).toBe(20);
      expect(qi.qiAgile).toBe(20);
      expect(qi.qiProtection).toBe(20);
      expect(qi.qiMeridian).toBe(20);
    });

    it('应正确重置真气分配', () => {
      const entity = new Entity();
      entity.addComponent(createQiComponent({ qi: 80, qiDestruction: 40 }));

      qiSystem.resetAllocation(entity);
      const qi = entity.getComponent('Qi');

      expect(qi.qiDestruction).toBe(0);
      expect(qiSystem.getRemainingQi(entity)).toBe(80);
    });
  });

  describe('KungfuSystem 测试', () => {
    it('应正确装备内功', () => {
      const entity = new Entity();
      entity.addComponent(createKungfuComponent({
        inventory: ['internal_hunyuan'],
        equipment: { internal: [], destruction: [], protection: [] },
      }));

      kungfuSystem.equipInternal(entity, 'internal_hunyuan');
      const kungfu = entity.getComponent('Kungfu');

      expect(kungfu.equipment.internal).toContain('internal_hunyuan');
      expect(kungfu.activeInternalId).toBe('internal_hunyuan');
    });

    it('应正确计算槽位容量', () => {
      const entity = new Entity();
      entity.addComponent(createKungfuComponent({
        inventory: ['internal_hunyuan'],
        equipment: { internal: ['internal_hunyuan'], destruction: [], protection: [] },
      }));

      const capacity = kungfuSystem.getSlotCapacity(entity);

      expect(capacity.destruction).toBe(2);
      expect(capacity.protection).toBe(2);
    });
  });

  describe('NPCSystem 测试', () => {
    it('应生成随机对手', () => {
      const npc = npcSystem.generateOpponent(80);

      expect(npc).not.toBeNull();
      expect(npc.hasComponent('Identity')).toBe(true);
      expect(npc.hasComponent('Kungfu')).toBe(true);
    });

    it('应获取NPC描述', () => {
      const npc = EntityFactory.createNPC({ name: '李四', level: 2, title: '江湖散人' });
      world.addEntity(npc);

      const desc = npcSystem.getNPCDescription(npc);

      expect(desc).toContain('李四');
      expect(desc).toContain('江湖散人');
    });
  });

  describe('World 测试', () => {
    it('应正确管理实体', () => {
      const player = EntityFactory.createPlayer();
      const npc = EntityFactory.createNPC();

      world.addEntity(player);
      world.addEntity(npc);

      expect(world.getPlayer()).toBe(player);
      expect(world.getAllNPCs()).toHaveLength(1);
      expect(world.entities.size).toBe(2);
    });

    it('应正确查询拥有特定组件的实体', () => {
      const player = EntityFactory.createPlayer();
      const npc = EntityFactory.createNPC();

      world.addEntity(player);
      world.addEntity(npc);

      const combatEntities = world.getEntitiesWithComponents('Attributes', 'Qi');
      expect(combatEntities).toHaveLength(2);
    });
  });
});
