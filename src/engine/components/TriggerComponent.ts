import * as THREE from 'three'
import { Component } from '../Component'
import { asString, asVec3, type Vec3Tuple } from '../ids'

const _world = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _euler = new THREE.Euler()
const _center = new THREE.Vector3()

export class TriggerComponent extends Component {
  static readonly typeId = 'Trigger'

  triggerId = 'trigger'
  size: Vec3Tuple = [2, 2.5, 2]
  private inside = false
  private helper: THREE.LineSegments | null = null

  contains(px: number, py: number, pz: number): boolean {
    const node = this.gameObject.node
    node.updateWorldMatrix(true, false)
    node.matrixWorld.decompose(_world, _quat, _scale)
    _center.copy(_world)
    _euler.setFromQuaternion(_quat, 'YXZ')
    const yaw = _euler.y
    const hx = (this.size[0] * Math.abs(_scale.x)) / 2
    const hy = (this.size[1] * Math.abs(_scale.y)) / 2
    const hz = (this.size[2] * Math.abs(_scale.z)) / 2
    const cos = Math.abs(Math.cos(yaw))
    const sin = Math.abs(Math.sin(yaw))
    const aabbX = hx * cos + hz * sin
    const aabbZ = hx * sin + hz * cos
    return (
      px >= _center.x - aabbX &&
      px <= _center.x + aabbX &&
      py >= _center.y - hy &&
      py <= _center.y + hy &&
      pz >= _center.z - aabbZ &&
      pz <= _center.z + aabbZ
    )
  }

  /** Returns true on the frame the player newly enters. */
  pollEnter(px: number, py: number, pz: number): boolean {
    const hit = this.enabled && this.gameObject.activeInHierarchy && this.contains(px, py, pz)
    const entered = hit && !this.inside
    this.inside = hit
    return entered
  }

  resetInside(): void {
    this.inside = false
  }

  showHelper(parent: THREE.Object3D, visible: boolean): void {
    if (!visible) {
      if (this.helper) this.helper.visible = false
      return
    }
    if (!this.helper) {
      const geo = new THREE.BoxGeometry(1, 1, 1)
      const edges = new THREE.EdgesGeometry(geo)
      this.helper = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0xffaa66, transparent: true, opacity: 0.8 }),
      )
      this.helper.name = '__triggerHelper'
      this.helper.userData.editorOnly = true
    }
    if (this.helper.parent !== parent) parent.add(this.helper)
    this.gameObject.node.updateWorldMatrix(true, false)
    this.gameObject.node.getWorldPosition(_world)
    this.gameObject.node.getWorldQuaternion(_quat)
    this.helper.position.copy(_world)
    this.helper.quaternion.copy(_quat)
    this.helper.scale.set(this.size[0], this.size[1], this.size[2])
    this.helper.visible = true
  }

  override onDestroy(): void {
    if (this.helper) {
      this.helper.removeFromParent()
      this.helper.geometry.dispose()
      if (this.helper.material instanceof THREE.Material) this.helper.material.dispose()
      this.helper = null
    }
  }

  serialize(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      triggerId: this.triggerId,
      size: [...this.size],
    }
  }

  deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    this.triggerId = asString(data.triggerId, 'trigger')
    this.size = asVec3(data.size, [2, 2.5, 2])
  }
}
