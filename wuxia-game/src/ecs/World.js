/**
 * World - ECS世界管理器
 * 管理所有实体和系统
 */
import { Entity } from './entities/Entity.js'
import { ComponentFactories } from './components/index.js'

export class World {
  constructor() {
    this.entities = new Map()
    this.systems = new Map()
    this.entityByType = {
      player: null,
      npc: new Map(),
    }
  }

  /**
   * 创建新实体
   * @param {string} id - 可选的实体ID
   */
  createEntity(id = null) {
    const entity = new Entity(id)
    this.entities.set(entity.id, entity)
    return entity
  }

  /**
   * 添加实体到世界
   * @param {Entity} entity - 实体对象
   */
  addEntity(entity) {
    this.entities.set(entity.id, entity)

    // 根据实体类型分类
    const identity = entity.getComponent('Identity')
    if (identity) {
      if (identity.entityType === 'player') {
        this.entityByType.player = entity
      } else {
        this.entityByType.npc.set(entity.id, entity)
      }
    }

    return entity
  }

  /**
   * 获取实体
   * @param {string} id - 实体ID
   */
  getEntity(id) {
    return this.entities.get(id)
  }

  /**
   * 移除实体
   * @param {string} id - 实体ID
   */
  removeEntity(id) {
    const entity = this.entities.get(id)
    if (entity) {
      const identity = entity.getComponent('Identity')
      if (identity) {
        if (identity.entityType === 'player') {
          this.entityByType.player = null
        } else {
          this.entityByType.npc.delete(id)
        }
      }
    }
    return this.entities.delete(id)
  }

  /**
   * 获取玩家实体
   */
  getPlayer() {
    return this.entityByType.player
  }

  /**
   * 获取所有NPC实体
   */
  getAllNPCs() {
    return Array.from(this.entityByType.npc.values())
  }

  /**
   * 获取拥有指定组件的所有实体
   * @param  {...string} componentTypes - 组件类型列表
   */
  getEntitiesWithComponents(...componentTypes) {
    const results = []
    for (const entity of this.entities.values()) {
      if (entity.hasAllComponents(...componentTypes)) {
        results.push(entity)
      }
    }
    return results
  }

  /**
   * 注册系统
   * @param {string} name - 系统名称
   * @param {Object} system - 系统对象
   */
  registerSystem(name, system) {
    system.world = this
    this.systems.set(name, system)
    return this
  }

  /**
   * 获取系统
   * @param {string} name - 系统名称
   */
  getSystem(name) {
    return this.systems.get(name)
  }

  /**
   * 更新所有系统
   * @param {number} deltaTime - 时间增量
   */
  update(deltaTime = 0) {
    for (const system of this.systems.values()) {
      if (system.update) {
        system.update(deltaTime)
      }
    }
  }

  /**
   * 序列化世界状态
   */
  serialize() {
    const entitiesData = []
    for (const entity of this.entities.values()) {
      entitiesData.push(entity.serialize())
    }
    return { entities: entitiesData }
  }

  /**
   * 从序列化数据恢复世界状态
   * @param {Object} data - 序列化的数据
   */
  deserialize(data) {
    this.entities.clear()
    this.entityByType.player = null
    this.entityByType.npc.clear()

    if (data.entities) {
      for (const entityData of data.entities) {
        const entity = Entity.deserialize(entityData, ComponentFactories)
        this.addEntity(entity)
      }
    }

    return this
  }

  /**
   * 清空世界
   */
  clear() {
    this.entities.clear()
    this.entityByType.player = null
    this.entityByType.npc.clear()
  }
}

// 全局世界实例
let worldInstance = null

export function getWorld() {
  if (!worldInstance) {
    worldInstance = new World()
  }
  return worldInstance
}

export function resetWorld() {
  worldInstance = new World()
  return worldInstance
}
