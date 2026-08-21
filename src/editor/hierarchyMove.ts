import * as THREE from 'three'
import type { Engine } from '../engine/Engine'
import type { SceneGameObject } from '../engine/SceneGameObject'

export type DropPlace = 'before' | 'after' | 'inside'

const _worldPos = new THREE.Vector3()
const _worldQuat = new THREE.Quaternion()
const _worldScale = new THREE.Vector3()
const _worldMat = new THREE.Matrix4()
const _parentInv = new THREE.Matrix4()
const _localMat = new THREE.Matrix4()
const _localPos = new THREE.Vector3()
const _localQuat = new THREE.Quaternion()
const _localScale = new THREE.Vector3()
const _localEuler = new THREE.Euler()

export function isHierarchyDescendant(ancestor: SceneGameObject, node: SceneGameObject): boolean {
  let p = node.parent
  while (p) {
    if (p === ancestor) return true
    p = p.parent
  }
  return false
}

/** Reparent / reorder while keeping world transform. */
export function hierarchyMove(
  engine: Engine,
  src: SceneGameObject,
  target: SceneGameObject | null,
  place: DropPlace,
): boolean {
  if (target) {
    if (src === target) return false
    if (isHierarchyDescendant(src, target)) return false
  }

  captureWorld(src)

  if (place === 'inside') {
    if (!target) return false
    detachFromRoots(engine, src)
    target.addChild(src)
  } else if (!target) {
    engine.scene.addAt(src)
  } else if (!target.parent) {
    const idx = engine.scene.roots.indexOf(target)
    if (idx < 0) return false
    const at = place === 'before' ? idx : idx + 1
    engine.scene.addAt(src, at)
  } else {
    const parent = target.parent
    detachFromRoots(engine, src)
    let at = parent.children.indexOf(target)
    if (at < 0) return false
    if (place === 'after') at += 1
    parent.addChildAt(src, at)
  }

  restoreWorld(src)
  return true
}

function detachFromRoots(engine: Engine, src: SceneGameObject): void {
  if (engine.scene.roots.includes(src)) engine.scene.remove(src)
}

function captureWorld(go: SceneGameObject): void {
  go.node.updateWorldMatrix(true, false)
  go.node.matrixWorld.decompose(_worldPos, _worldQuat, _worldScale)
}

function restoreWorld(go: SceneGameObject): void {
  const parentNode = go.node.parent
  if (!parentNode) {
    go.node.position.copy(_worldPos)
    go.node.quaternion.copy(_worldQuat)
    go.node.scale.copy(_worldScale)
    return
  }
  parentNode.updateWorldMatrix(true, false)
  _worldMat.compose(_worldPos, _worldQuat, _worldScale)
  _parentInv.copy(parentNode.matrixWorld).invert()
  _localMat.multiplyMatrices(_parentInv, _worldMat)
  _localMat.decompose(_localPos, _localQuat, _localScale)
  go.node.position.copy(_localPos)
  go.node.quaternion.copy(_localQuat)
  go.node.scale.copy(_localScale)
  _localEuler.setFromQuaternion(_localQuat, 'XYZ')
  go.node.rotation.copy(_localEuler)
}

export function dropPlaceFromClientY(row: HTMLElement, clientY: number): DropPlace {
  const rect = row.getBoundingClientRect()
  const t = (clientY - rect.top) / Math.max(rect.height, 1)
  if (t < 0.25) return 'before'
  if (t > 0.75) return 'after'
  return 'inside'
}
