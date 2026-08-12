import * as THREE from 'three'
import type { Input } from './Input'
import type { ColliderWorld } from '../world/colliders'

const EYE_HEIGHT = 1.6
const RADIUS = 0.28
const WALK_SPEED = 4.5
const SPRINT_SPEED = 7.2
const MOUSE_SENS = 0.0022

export class PlayerController {
  readonly camera: THREE.PerspectiveCamera
  readonly position = new THREE.Vector3(-3.5, 0, 5)
  yaw = 0
  pitch = 0

  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ')
  private readonly forward = new THREE.Vector3()
  private readonly right = new THREE.Vector3()
  private readonly wish = new THREE.Vector3()

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.08, 120)
    this.syncCamera()
  }

  setSpawn(x: number, z: number, yaw = 0): void {
    this.position.set(x, 0, z)
    this.yaw = yaw
    this.pitch = 0
    this.syncCamera()
  }

  onMouseMove(dx: number, dy: number): void {
    this.yaw -= dx * MOUSE_SENS
    this.pitch -= dy * MOUSE_SENS
    const limit = Math.PI / 2 - 0.05
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch))
  }

  update(dt: number, input: Input, colliders: ColliderWorld): void {
    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

    this.wish.set(0, 0, 0)
    this.wish.addScaledVector(this.forward, -input.moveZ)
    this.wish.addScaledVector(this.right, input.moveX)

    if (this.wish.lengthSq() > 0) {
      this.wish.normalize()
      const speed = input.sprint ? SPRINT_SPEED : WALK_SPEED
      const nx = this.position.x + this.wish.x * speed * dt
      const nz = this.position.z + this.wish.z * speed * dt
      const resolved = colliders.resolveCircle(nx, nz, RADIUS, 0.1, EYE_HEIGHT)
      this.position.x = resolved.x
      this.position.z = resolved.z
    }

    this.syncCamera()
  }

  private syncCamera(): void {
    this.camera.position.set(this.position.x, EYE_HEIGHT, this.position.z)
    this.euler.set(this.pitch, this.yaw, 0)
    this.camera.quaternion.setFromEuler(this.euler)
  }
}
