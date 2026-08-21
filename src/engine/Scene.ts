import * as THREE from 'three'
import type { SceneGameObject } from './SceneGameObject'

export class Scene {
  name = 'Untitled'
  readonly threeScene: THREE.Scene
  private readonly _roots: SceneGameObject[] = []

  constructor(threeScene?: THREE.Scene) {
    this.threeScene = threeScene ?? new THREE.Scene()
  }

  get roots(): readonly SceneGameObject[] {
    return this._roots
  }

  add(obj: SceneGameObject): void {
    this.addAt(obj)
  }

  /** Insert as a root. Detaches from any previous parent first. */
  addAt(obj: SceneGameObject, index?: number): void {
    const prevRoot = this._roots.indexOf(obj)
    if (prevRoot >= 0) {
      this._roots.splice(prevRoot, 1)
      let at = index ?? this._roots.length
      if (prevRoot < at) at -= 1
      this._roots.splice(Math.max(0, Math.min(at, this._roots.length)), 0, obj)
      return
    }
    if (obj.parent) obj.setParent(null)
    const at = index ?? this._roots.length
    this._roots.splice(Math.max(0, Math.min(at, this._roots.length)), 0, obj)
    if (!obj.node.parent) this.threeScene.add(obj.node)
  }

  remove(obj: SceneGameObject): void {
    const i = this._roots.indexOf(obj)
    if (i >= 0) {
      this._roots.splice(i, 1)
      this.threeScene.remove(obj.node)
    }
    if (obj.parent) obj.setParent(null)
  }

  clear(): void {
    for (const root of [...this._roots]) {
      this.remove(root)
      root.destroy()
    }
  }

  traverse(fn: (go: SceneGameObject) => void): void {
    for (const root of this._roots) root.traverse(fn)
  }

  findByUuid(uuid: string): SceneGameObject | undefined {
    let found: SceneGameObject | undefined
    this.traverse((go) => {
      if (!found && go.uuid === uuid) found = go
    })
    return found
  }

  findByName(name: string): SceneGameObject | undefined {
    let found: SceneGameObject | undefined
    this.traverse((go) => {
      if (!found && go.name === name) found = go
    })
    return found
  }

  findByTag(tag: string): SceneGameObject | undefined {
    let found: SceneGameObject | undefined
    this.traverse((go) => {
      if (!found && go.hasTag(tag)) found = go
    })
    return found
  }

  findAllByTag(tag: string): SceneGameObject[] {
    const out: SceneGameObject[] = []
    this.traverse((go) => {
      if (go.hasTag(tag)) out.push(go)
    })
    return out
  }
}
