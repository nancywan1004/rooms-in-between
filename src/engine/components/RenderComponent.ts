import * as THREE from 'three'
import { Component } from '../Component'
import { asNumber, asString } from '../ids'
import { getMaterial } from '../../theme/materials'
import type { PaletteKey } from '../../theme/palette'

export type PrimitiveGeo = 'box' | 'plane' | 'cylinder'

export type RenderSource =
  | { source: 'empty' }
  | { source: 'primitive'; geo: PrimitiveGeo; args: number[] }
  | { source: 'factory'; factoryId: string; args?: Record<string, unknown> }

export class RenderComponent extends Component {
  static readonly typeId = 'Render'

  source: RenderSource = { source: 'empty' }
  color?: number
  roughness?: number
  metalness?: number
  opacity?: number
  emissive?: number
  emissiveIntensity?: number
  castShadow = true

  rebuildPrimitive(): void {
    this.clearVisual()
    if (this.source.source !== 'primitive') return
    this.buildPrimitive(this.source.geo, this.source.args)
    this.applyMaterialOverrides()
    this.applyShadow()
  }

  clearVisual(): void {
    const node = this.gameObject.node
    for (const child of [...node.children]) {
      if (child.userData.editorOnly) continue
      node.remove(child)
    }
  }

  private buildPrimitive(geo: PrimitiveGeo, args: number[]): void {
    let geometry: THREE.BufferGeometry
    if (geo === 'plane') {
      geometry = new THREE.PlaneGeometry(args[0] ?? 1, args[1] ?? 1)
    } else if (geo === 'cylinder') {
      geometry = new THREE.CylinderGeometry(args[0] ?? 0.5, args[1] ?? 0.5, args[2] ?? 1, args[3] ?? 12)
    } else {
      geometry = new THREE.BoxGeometry(args[0] ?? 1, args[1] ?? 1, args[2] ?? 1)
    }
    const mat = getMaterial('MAT_WALL' as PaletteKey, { roughness: 0.78 }).clone()
    mat.userData.ribCloned = true
    const mesh = new THREE.Mesh(geometry, mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.gameObject.node.add(mesh)
  }

  applyMaterialOverrides(): void {
    this.gameObject.node.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (let i = 0; i < mats.length; i++) {
        const m = mats[i]
        if (!(m instanceof THREE.MeshStandardMaterial)) continue
        if (!m.userData.ribCloned) {
          const clone = m.clone()
          clone.userData.ribCloned = true
          if (Array.isArray(obj.material)) obj.material[i] = clone
          else obj.material = clone
          this.applyToMat(clone)
        } else {
          this.applyToMat(m)
        }
      }
    })
  }

  private applyToMat(m: THREE.MeshStandardMaterial): void {
    if (this.color !== undefined) m.color.setHex(this.color)
    if (this.roughness !== undefined) m.roughness = this.roughness
    if (this.metalness !== undefined) m.metalness = this.metalness
    if (this.opacity !== undefined) {
      m.opacity = this.opacity
      m.transparent = this.opacity < 1
    }
    if (this.emissive !== undefined) m.emissive.setHex(this.emissive)
    if (this.emissiveIntensity !== undefined) m.emissiveIntensity = this.emissiveIntensity
  }

  applyShadow(): void {
    this.gameObject.node.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.castShadow = this.castShadow
    })
  }

  serialize(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      source: this.source,
      color: this.color,
      roughness: this.roughness,
      metalness: this.metalness,
      opacity: this.opacity,
      emissive: this.emissive,
      emissiveIntensity: this.emissiveIntensity,
      castShadow: this.castShadow,
    }
  }

  deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    if (typeof data.color === 'number') this.color = data.color
    if (typeof data.roughness === 'number') this.roughness = data.roughness
    if (typeof data.metalness === 'number') this.metalness = data.metalness
    if (typeof data.opacity === 'number') this.opacity = data.opacity
    if (typeof data.emissive === 'number') this.emissive = data.emissive
    if (typeof data.emissiveIntensity === 'number') this.emissiveIntensity = data.emissiveIntensity
    if (typeof data.castShadow === 'boolean') this.castShadow = data.castShadow
    if (data.source && typeof data.source === 'object') {
      const src = data.source as RenderSource
      if (src.source === 'primitive') {
        this.source = {
          source: 'primitive',
          geo: src.geo === 'plane' || src.geo === 'cylinder' ? src.geo : 'box',
          args: Array.isArray(src.args) ? src.args.map((n) => asNumber(n, 1)) : [1, 1, 1],
        }
      } else if (src.source === 'factory') {
        this.source = {
          source: 'factory',
          factoryId: asString(src.factoryId),
          args: src.args,
        }
      } else {
        this.source = { source: 'empty' }
      }
    }
  }
}
