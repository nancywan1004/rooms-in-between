import * as THREE from 'three'
import { Behaviour } from '../engine/Behaviour'
import { asNumber } from '../engine/ids'
import type { Waypoint } from '../world/layout'

export class ManagerPatrolBehaviour extends Behaviour {
  static readonly typeId = 'ManagerPatrol'
  speed = 1.6
  waypoints: Waypoint[] = []
  private index = 0
  private readonly pos = new THREE.Vector3()

  override awake(): void {
    this.pos.copy(this.gameObject.node.position)
    this.index = 0
  }

  override update(dt: number): void {
    if (this.waypoints.length < 2) return
    const target = this.waypoints[this.index]
    if (!target) return
    const dx = target.x - this.pos.x
    const dz = target.z - this.pos.z
    const dist = Math.hypot(dx, dz)
    if (dist < 0.15) {
      this.index = (this.index + 1) % this.waypoints.length
      return
    }
    const step = Math.min(this.speed * dt, dist)
    this.pos.x += (dx / dist) * step
    this.pos.z += (dz / dist) * step
    this.gameObject.node.position.x = this.pos.x
    this.gameObject.node.position.z = this.pos.z
    this.gameObject.node.rotation.y = Math.atan2(dx, dz)
  }

  override serialize(): Record<string, unknown> {
    return {
      ...super.serialize(),
      speed: this.speed,
      waypoints: this.waypoints.map((w) => ({ x: w.x, z: w.z })),
    }
  }

  override deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    this.speed = asNumber(data.speed, 1.6)
    if (Array.isArray(data.waypoints)) {
      this.waypoints = data.waypoints
        .map((w) => {
          if (!w || typeof w !== 'object') return null
          const rec = w as { x?: unknown; z?: unknown }
          return { x: asNumber(rec.x, 0), z: asNumber(rec.z, 0) }
        })
        .filter((w): w is Waypoint => w !== null)
    }
  }
}
