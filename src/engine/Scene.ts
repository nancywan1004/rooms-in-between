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
    if (this._roots.includes(obj)) return
    obj.setParent(null)
    this._roots.push(obj)
    this.threeScene.add(obj.node)
  }

  remove(obj: SceneGameObject): void {
    const i = this._roots.indexOf(obj)
    if (i >= 0) {
      this._roots.splice(i, 1)
      this.threeScene.remove(obj.node)
    }
    obj.setParent(null)
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
