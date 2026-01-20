/**
 * Entity - 实体基类
 * 实体只是组件的容器，通过ID标识
 */
export class Entity {
  constructor(id = null) {
    this.id = id || `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.components = new Map()
  }

  /**
   * 添加组件
   * @param {Object} component - 组件对象，必须有type属性
   */
  addComponent(component) {
    if (!component.type) {
      throw new Error('Component must have a type property')
    }
    this.components.set(component.type, component)
    return this
  }

  /**
   * 获取组件
   * @param {string} type - 组件类型
   */
  getComponent(type) {
    return this.components.get(type)
  }

  /**
   * 检查是否拥有组件
   * @param {string} type - 组件类型
   */
  hasComponent(type) {
    return this.components.has(type)
  }

  /**
   * 移除组件
   * @param {string} type - 组件类型
   */
  removeComponent(type) {
    return this.components.delete(type)
  }

  /**
   * 检查是否拥有所有指定的组件
   * @param  {...string} types - 组件类型列表
   */
  hasAllComponents(...types) {
    return types.every(type => this.components.has(type))
  }

  /**
   * 获取所有组件
   */
  getAllComponents() {
    return Object.fromEntries(this.components)
  }

  /**
   * 序列化实体为普通对象（用于存档）
   */
  serialize() {
    const data = { id: this.id }
    for (const [type, component] of this.components) {
      data[type] = { ...component }
    }
    return data
  }

  /**
   * 从普通对象反序列化
   * @param {Object} data - 序列化的数据
   * @param {Object} componentFactories - 组件工厂函数映射
   */
  static deserialize(data, componentFactories) {
    const entity = new Entity(data.id)
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue
      if (componentFactories[key]) {
        entity.addComponent(componentFactories[key](value))
      }
    }
    return entity
  }
}
