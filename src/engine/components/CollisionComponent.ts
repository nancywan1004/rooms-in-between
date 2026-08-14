import * as THREE from 'three'
import { Component } from '../Component'
import { asBool, asString, asVec3, makeId, type Vec3Tuple } from '../ids'
import type { ColliderBox, ColliderWorld } from '../../world/colliders'

const _worldPos = new THREE.Vector3()
const _worldQuat = new THREE.Quaternion()
const _worldScale = new THREE.Vector3()
const _euler = new THREE.Euler()
const _offset = new THREE.Vector3()

export class CollisionComponent extends Component {
  static readonly typeId = 'Collision'

  kind: ColliderBox['kind'] = 'furniture'
  size: Vec3Tuple = [1, 1, 1]
  offset: Vec3Tuple = [0, 0.5, 0]
  colliderId = ''
  helperVisible = true

  private helper: THREE.LineSegments | null = null

  constructor() {
    super()
    this.colliderId = `col_${makeId()}`
  }

  syncToWorld(colliders: ColliderWorld): void {
    colliders.removeById(this.colliderId)
    if (!this.enabled || !this.gameObject.activeInHierarchy) {
      this.setHelperVisible(false)
      return
    }

    const node = this.gameObject.node
    node.updateWorldMatrix(true, false)
    node.matrixWorld.decompose(_worldPos, _worldQuat, _worldScale)
    _offset.set(this.offset[0], this.offset[1], this.offset[2])
    _offset.applyMatrix4(node.matrixWorld)

    _euler.setFromQuaternion(_worldQuat, 'YXZ')
    const yaw = _euler.y
    const sx = this.size[0] * Math.abs(_worldScale.x)
    const sy = this.size[1] * Math.abs(_worldScale.y)
    const sz = this.size[2] * Math.abs(_worldScale.z)
    const cos = Math.abs(Math.cos(yaw))
    const sin = Math.abs(Math.sin(yaw))
    const aabbX = sx * cos + sz * sin
    const aabbZ = sx * sin + sz * cos

    colliders.addAabb(this.colliderId, this.kind, _offset.x, _offset.y, _offset.z, aabbX, sy, aabbZ)
    this.updateHelper(sx, sy, sz)
  }

  showHelper(parent: THREE.Object3D, visible: boolean): void {
    this.helperVisible = visible
    if (!visible) {
      this.setHelperVisible(false)
      return
    }
    if (!this.helper) {
      const geo = new THREE.BoxGeometry(1, 1, 1)
      const edges = new THREE.EdgesGeometry(geo)
      this.helper = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x88ffaa, transparent: true, opacity: 0.7 }),
      )
      this.helper.name = '__collisionHelper'
      this.helper.userData.editorOnly = true
    }
    if (this.helper.parent !== parent) parent.add(this.helper)
    this.updateHelper(this.size[0], this.size[1], this.size[2])
    this.helper.visible = visible && this.enabled
  }

  private updateHelper(sx: number, sy: number, sz: number): void {
    if (!this.helper) return
    const node = this.gameObject.node
    node.updateWorldMatrix(true, false)
    _offset.set(this.offset[0], this.offset[1], this.offset[2])
    _offset.applyMatrix4(node.matrixWorld)
    this.helper.position.copy(_offset)
    node.getWorldQuaternion(_worldQuat)
    this.helper.quaternion.copy(_worldQuat)
    this.helper.scale.set(sx, sy, sz)
  }

  private setHelperVisible(v: boolean): void {
    if (this.helper) this.helper.visible = v
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
      kind: this.kind,
      size: [...this.size],
      offset: [...this.offset],
      colliderId: this.colliderId,
    }
  }

  deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    this.kind = (asString(data.kind, 'furniture') as ColliderBox['kind']) || 'furniture'
    this.size = asVec3(data.size, [1, 1, 1])
    this.offset = asVec3(data.offset, [0, 0.5, 0])
    if (typeof data.colliderId === 'string' && data.colliderId) this.colliderId = data.colliderId
    this.enabled = asBool(data.enabled, true)
  }
}
