import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { getMaterial, glassMaterial } from '../theme/materials'
import type { PaletteKey } from '../theme/palette'
import type { ColliderWorld } from './colliders'
import type { DoorRecord } from './doors'

let idSeq = 0
const nextId = (prefix: string) => `${prefix}_${++idSeq}`

export function createFloor(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  w: number,
  d: number,
  matKey: PaletteKey = 'MAT_FLOOR',
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    getMaterial(matKey, { roughness: 0.85 }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(x, 0.001, z)
  mesh.receiveShadow = true
  parent.add(mesh)
  // Floor doesn't need player collision (y=0 plane)
  void colliders
  return mesh
}

export function createCeiling(
  parent: THREE.Object3D,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    getMaterial('MAT_CEILING', { roughness: 0.9, side: THREE.DoubleSide }),
  )
  mesh.rotation.x = Math.PI / 2
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

/** Wall segment as box; center at floor contact mid-height. */
export function createWall(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  cx: number,
  cz: number,
  length: number,
  height: number,
  thickness: number,
  rotationY: number,
  matKey: PaletteKey = 'MAT_WALL',
  withCollider = true,
): THREE.Mesh {
  const geo = new RoundedBoxGeometry(length, height, thickness, 2, 0.02)
  const mesh = new THREE.Mesh(geo, getMaterial(matKey, { roughness: 0.78 }))
  mesh.position.set(cx, height / 2, cz)
  mesh.rotation.y = rotationY
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)

  if (withCollider) {
    // Approximate world AABB for axis-aligned walls; for rotated, expand
    const cos = Math.abs(Math.cos(rotationY))
    const sin = Math.abs(Math.sin(rotationY))
    const sx = length * cos + thickness * sin
    const sz = length * sin + thickness * cos
    colliders.addAabb(nextId('wall'), 'wall', cx, height / 2, cz, sx, height, sz)
  }
  return mesh
}

/**
 * Build a wall with a centered door opening.
 * Wall runs along local X after rotationY (0 = along world X, facing +Z).
 */
export function createWallWithDoorway(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  cx: number,
  cz: number,
  totalLength: number,
  height: number,
  thickness: number,
  rotationY: number,
  doorWidth: number,
  doorHeight: number,
  matKey: PaletteKey = 'MAT_WALL',
): void {
  const side = (totalLength - doorWidth) / 2
  if (side < 0.05) return

  const alongX = Math.cos(rotationY)
  const alongZ = -Math.sin(rotationY)

  // Left segment center
  const leftOffset = -(doorWidth / 2 + side / 2)
  createWall(
    parent,
    colliders,
    cx + alongX * leftOffset,
    cz + alongZ * leftOffset,
    side,
    height,
    thickness,
    rotationY,
    matKey,
  )

  // Right segment
  const rightOffset = doorWidth / 2 + side / 2
  createWall(
    parent,
    colliders,
    cx + alongX * rightOffset,
    cz + alongZ * rightOffset,
    side,
    height,
    thickness,
    rotationY,
    matKey,
  )

  // Lintel above door
  if (height > doorHeight + 0.05) {
    const lintelH = height - doorHeight
    const lintel = new THREE.Mesh(
      new RoundedBoxGeometry(doorWidth, lintelH, thickness, 2, 0.02),
      getMaterial(matKey, { roughness: 0.78 }),
    )
    lintel.position.set(cx, doorHeight + lintelH / 2, cz)
    lintel.rotation.y = rotationY
    lintel.castShadow = true
    parent.add(lintel)
    const cos = Math.abs(Math.cos(rotationY))
    const sin = Math.abs(Math.sin(rotationY))
    const sx = doorWidth * cos + thickness * sin
    const sz = doorWidth * sin + thickness * cos
    colliders.addAabb(nextId('lintel'), 'wall', cx, doorHeight + lintelH / 2, cz, sx, lintelH, sz)
  }
}

export function createGlassWall(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  cx: number,
  cz: number,
  length: number,
  height: number,
  thickness: number,
  rotationY: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(length, height, thickness, 2, 0.01),
    glassMaterial(),
  )
  mesh.position.set(cx, height / 2, cz)
  mesh.rotation.y = rotationY
  parent.add(mesh)

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(length + 0.06, 0.08, thickness + 0.04, 1, 0.01),
    getMaterial('MAT_LAVENDER_GREY', { roughness: 0.5 }),
  )
  frame.position.set(cx, height - 0.04, cz)
  frame.rotation.y = rotationY
  parent.add(frame)

  const cos = Math.abs(Math.cos(rotationY))
  const sin = Math.abs(Math.sin(rotationY))
  const sx = length * cos + thickness * sin
  const sz = length * sin + thickness * cos
  colliders.addAabb(nextId('glass'), 'wall', cx, height / 2, cz, sx, height, sz)
  return mesh
}

export type DoorVisual = {
  group: THREE.Group
  leaf: THREE.Object3D
  record: DoorRecord
}

export function createDoorVisual(parent: THREE.Object3D, record: DoorRecord): DoorVisual {
  const group = new THREE.Group()
  group.position.set(record.x, 0, record.z)
  group.rotation.y = record.rotationY

  const accentKey: PaletteKey =
    record.accent === 'printer'
      ? 'MAT_ACCENT_PRINTER'
      : record.accent === 'break'
        ? 'MAT_ACCENT_BREAK'
        : record.accent === 'manager'
          ? 'MAT_ACCENT_MANAGER'
          : record.accent === 'meeting'
            ? 'MAT_ACCENT_MEETING'
            : 'MAT_CHARCOAL'

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(record.width + 0.12, record.height + 0.08, 0.12, 2, 0.015),
    getMaterial(accentKey, { roughness: 0.55 }),
  )
  frame.position.set(0, record.height / 2 + 0.02, 0)
  group.add(frame)

  const leaf = new THREE.Group()
  const panel = new THREE.Mesh(
    new RoundedBoxGeometry(record.width - 0.04, record.height - 0.06, 0.06, 2, 0.02),
    getMaterial(
      record.state === 'locked' ? 'MAT_CHARCOAL' : 'MAT_WARM_WHITE',
      { roughness: 0.6 },
    ),
  )
  panel.position.set(0, record.height / 2, 0)
  panel.castShadow = true
  leaf.add(panel)

  // Accent stripe
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, record.height - 0.2, 0.07),
    getMaterial(accentKey, { roughness: 0.4, metalness: 0.15 }),
  )
  stripe.position.set(record.width * 0.28, record.height / 2, 0)
  leaf.add(stripe)

  // Lock indicator
  if (record.state === 'locked') {
    const lock = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.08),
      getMaterial('MAT_GOLD', { roughness: 0.35, metalness: 0.4 }),
    )
    lock.position.set(record.width * 0.32, record.height * 0.5, 0.02)
    leaf.add(lock)
  }

  // Pivot at left edge for swing
  leaf.position.set(-record.width / 2, 0, 0)
  panel.position.x = record.width / 2
  stripe.position.x = record.width / 2 + record.width * 0.28
  group.add(leaf)
  parent.add(group)

  return { group, leaf, record }
}

export function syncDoorVisual(visual: DoorVisual, state: DoorRecord['state']): void {
  const open = state === 'open'
  const target = open ? -Math.PI / 2 : 0
  visual.leaf.rotation.y = target

  // Darken locked doors
  visual.leaf.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
      if (obj.name === 'skip') return
    }
  })
}

export function createColumn(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  height: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(0.35, height, 0.35, 2, 0.04),
    getMaterial('MAT_LAVENDER_GREY', { roughness: 0.7 }),
  )
  mesh.position.set(x, height / 2, z)
  mesh.castShadow = true
  parent.add(mesh)
  colliders.addAabb(nextId('col'), 'wall', x, height / 2, z, 0.4, height, 0.4)
  return mesh
}

export function createCeilingLight(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  color = 0xfff5ea,
  intensity = 1.2,
): THREE.PointLight {
  const fixture = new THREE.Mesh(
    new RoundedBoxGeometry(1.2, 0.06, 0.4, 1, 0.01),
    getMaterial('MAT_WARM_WHITE', { roughness: 0.4, emissive: color, emissiveIntensity: 0.35 }),
  )
  fixture.position.set(x, y - 0.05, z)
  parent.add(fixture)

  const light = new THREE.PointLight(color, intensity, 14, 2)
  light.position.set(x, y - 0.2, z)
  light.castShadow = false
  parent.add(light)
  return light
}
