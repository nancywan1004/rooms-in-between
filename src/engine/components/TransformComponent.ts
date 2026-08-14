import * as THREE from 'three'
import { Component } from '../Component'
import { asVec3, type Vec3Tuple } from '../ids'

export class TransformComponent extends Component {
  static readonly typeId = 'Transform'

  get position(): THREE.Vector3 {
    return this.gameObject.node.position
  }

  get rotation(): THREE.Euler {
    return this.gameObject.node.rotation
  }

  get scale(): THREE.Vector3 {
    return this.gameObject.node.scale
  }

  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z)
  }

  setEuler(x: number, y: number, z: number): void {
    this.rotation.set(x, y, z)
  }

  setScale(x: number, y: number, z: number): void {
    this.scale.set(x, y, z)
  }

  serialize(): Record<string, unknown> {
    const p = this.position
    const r = this.rotation
    const s = this.scale
    return {
      enabled: this.enabled,
      position: [p.x, p.y, p.z],
      rotation: [r.x, r.y, r.z],
      scale: [s.x, s.y, s.z],
    }
  }

  deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    const p = asVec3(data.position)
    const r = asVec3(data.rotation)
    const s = asVec3(data.scale, [1, 1, 1])
    this.position.set(p[0], p[1], p[2])
    this.rotation.set(r[0], r[1], r[2])
    this.scale.set(s[0], s[1], s[2])
  }

  toTuples(): { position: Vec3Tuple; rotation: Vec3Tuple; scale: Vec3Tuple } {
    const p = this.position
    const r = this.rotation
    const s = this.scale
    return {
      position: [p.x, p.y, p.z],
      rotation: [r.x, r.y, r.z],
      scale: [s.x, s.y, s.z],
    }
  }
}
