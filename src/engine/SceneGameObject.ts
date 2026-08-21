import * as THREE from 'three'
import { makeId } from './ids'
import { Component, type ComponentCtor } from './Component'
import { TransformComponent } from './components/TransformComponent'

export class SceneGameObject {
  readonly uuid: string
  name: string
  tags: string[] = []
  active = true
  prefabId?: string
  readonly node: THREE.Group

  private _parent: SceneGameObject | null = null
  private readonly _children: SceneGameObject[] = []
  private readonly _components: Component[] = []

  constructor(name = 'GameObject', uuid?: string) {
    this.uuid = uuid ?? makeId()
    this.name = name
    this.node = new THREE.Group()
    this.node.name = name
    this.node.userData.sceneGameObject = this
    const transform = new TransformComponent()
    transform.gameObject = this
    this._components.push(transform)
  }

  get parent(): SceneGameObject | null {
    return this._parent
  }

  get children(): readonly SceneGameObject[] {
    return this._children
  }

  get components(): readonly Component[] {
    return this._components
  }

  get transform(): TransformComponent {
    return this._components[0] as TransformComponent
  }

  get activeInHierarchy(): boolean {
    if (!this.active) return false
    return this._parent ? this._parent.activeInHierarchy : true
  }

  addChild(child: SceneGameObject): void {
    if (child === this) return
    child.setParent(this)
  }

  addChildAt(child: SceneGameObject, index: number): void {
    if (child === this) return
    child.setParent(this, index)
  }

  removeChild(child: SceneGameObject): void {
    if (child._parent !== this) return
    child.setParent(null)
  }

  setParent(parent: SceneGameObject | null, index?: number): void {
    if (parent === this) return
    if (this._parent === parent) {
      if (parent && index !== undefined) this.reorderInParent(index)
      return
    }
    if (this._parent) {
      const i = this._parent._children.indexOf(this)
      if (i >= 0) this._parent._children.splice(i, 1)
      this._parent.node.remove(this.node)
    }
    this._parent = parent
    if (parent) {
      const at = index === undefined ? parent._children.length : Math.max(0, Math.min(index, parent._children.length))
      parent._children.splice(at, 0, this)
      parent.node.add(this.node)
    }
  }

  private reorderInParent(index: number): void {
    if (!this._parent) return
    const list = this._parent._children
    const from = list.indexOf(this)
    if (from < 0) return
    list.splice(from, 1)
    let at = Math.max(0, Math.min(index, list.length))
    if (from < at) at -= 1
    list.splice(at, 0, this)
  }

  addComponent<T extends Component>(ctor: ComponentCtor<T>): T {
    const existing = this.getComponent(ctor)
    if (existing) return existing
    const c = new ctor()
    c.gameObject = this
    this._components.push(c)
    return c
  }

  attachComponent(component: Component): Component {
    const ctor = component.constructor as ComponentCtor
    const existing = this.getComponent(ctor)
    if (existing && existing !== component) return existing
    component.gameObject = this
    if (!this._components.includes(component)) this._components.push(component)
    return component
  }

  getComponent<T extends Component>(ctor: ComponentCtor<T>): T | undefined {
    return this._components.find((c) => c instanceof ctor) as T | undefined
  }

  getComponentByType(typeId: string): Component | undefined {
    return this._components.find((c) => c.typeId === typeId)
  }

  removeComponent(component: Component): void {
    if (component instanceof TransformComponent) return
    const i = this._components.indexOf(component)
    if (i < 0) return
    component.onDestroy()
    this._components.splice(i, 1)
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag)
  }

  traverse(fn: (go: SceneGameObject) => void): void {
    fn(this)
    for (const child of this._children) child.traverse(fn)
  }

  destroy(): void {
    for (const child of [...this._children]) child.destroy()
    for (const c of [...this._components]) {
      if (!(c instanceof TransformComponent)) c.onDestroy()
    }
    this.setParent(null)
    this.node.removeFromParent()
    this.node.clear()
  }
}
