import * as THREE from 'three'
import { getMaterial } from '../theme/materials'
import type { Waypoint } from '../world/layout'
import { createNpc } from '../world/furniture'

const SPEED = 1.6

export class ManagerPatrol {
  readonly group: THREE.Group
  private waypoints: Waypoint[]
  private index = 0
  private readonly pos = new THREE.Vector3()

  constructor(parent: THREE.Object3D, waypoints: Waypoint[]) {
    this.waypoints = waypoints
    const start = waypoints[0] ?? { x: 0, z: -10 }
    this.group = createNpc(parent, start.x, start.z, 'MAT_MANAGER', 1.85)
    this.pos.set(start.x, 0, start.z)

    // Gold badge
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.02),
      getMaterial('MAT_GOLD', { roughness: 0.35, metalness: 0.45 }),
    )
    badge.position.set(0.18, 1.2, 0.2)
    this.group.add(badge)
  }

  update(dt: number): void {
    if (this.waypoints.length < 2) return
    const target = this.waypoints[this.index]!
    const dx = target.x - this.pos.x
    const dz = target.z - this.pos.z
    const dist = Math.hypot(dx, dz)

    if (dist < 0.15) {
      this.index = (this.index + 1) % this.waypoints.length
      return
    }

    const step = Math.min(SPEED * dt, dist)
    this.pos.x += (dx / dist) * step
    this.pos.z += (dz / dist) * step
    this.group.position.x = this.pos.x
    this.group.position.z = this.pos.z
    this.group.rotation.y = Math.atan2(dx, dz)
  }
}
