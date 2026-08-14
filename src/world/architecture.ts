import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { carpetMaterial, ceilingMaterial, getMaterial, glassMaterial, wallMaterial } from '../theme/materials'
import type { PaletteKey } from '../theme/palette'
import { sloganTexture } from '../theme/textures'
import type { ColliderWorld } from './colliders'
import type { DoorRecord } from './doors'
import { getWallBatcher, isWorldBatching, queueCeilingPanel } from './batching'

let idSeq = 0
const nextId = (prefix: string) => `${prefix}_${++idSeq}`

export function createFloor(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  w: number,
  d: number,
  _matKey: PaletteKey = 'MAT_FLOOR',
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    carpetMaterial(Math.max(2, w / 2), Math.max(2, d / 2)),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(x, 0.001, z)
  mesh.receiveShadow = true
  parent.add(mesh)
  void colliders
  void _matKey
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
    ceilingMaterial(Math.max(2, w / 1.5), Math.max(2, d / 1.5)),
  )
  mesh.rotation.x = Math.PI / 2
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

/** Wall segment — batched when world batch session is active */
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
): THREE.Mesh | null {
  const usePaint = matKey === 'MAT_WALL'
  const mat = usePaint
    ? wallMaterial(Math.max(1, length / 2), height / 3)
    : getMaterial(matKey, { roughness: 0.82 })

  const batcher = getWallBatcher()
  if (batcher) {
    batcher.addBox(
      `wall:${matKey}`,
      mat,
      cx,
      height / 2,
      cz,
      length,
      height,
      thickness,
      rotationY,
      false,
    )
    batcher.addBox(
      'baseboard',
      getMaterial('MAT_BASEBOARD', { roughness: 0.7 }),
      cx,
      0.04,
      cz,
      length,
      0.08,
      thickness + 0.02,
      rotationY,
      false,
    )
  } else {
    const geo = new RoundedBoxGeometry(length, height, thickness, 2, 0.015)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(cx, height / 2, cz)
    mesh.rotation.y = rotationY
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.08, thickness + 0.02),
      getMaterial('MAT_BASEBOARD', { roughness: 0.7 }),
    )
    base.position.set(cx, 0.04, cz)
    base.rotation.y = rotationY
    parent.add(base)
  }

  if (withCollider) {
    const cos = Math.abs(Math.cos(rotationY))
    const sin = Math.abs(Math.sin(rotationY))
    const sx = length * cos + thickness * sin
    const sz = length * sin + thickness * cos
    colliders.addAabb(nextId('wall'), 'wall', cx, height / 2, cz, sx, height, sz)
  }
  return null
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
    const usePaint = matKey === 'MAT_WALL'
    const mat = usePaint ? wallMaterial() : getMaterial(matKey, { roughness: 0.78 })
    const batcher = getWallBatcher()
    if (batcher) {
      batcher.addBox(
        `wall:${matKey}`,
        mat,
        cx,
        doorHeight + lintelH / 2,
        cz,
        doorWidth,
        lintelH,
        thickness,
        rotationY,
        false,
      )
    } else {
      const lintel = new THREE.Mesh(
        new RoundedBoxGeometry(doorWidth, lintelH, thickness, 2, 0.02),
        mat,
      )
      lintel.position.set(cx, doorHeight + lintelH / 2, cz)
      lintel.rotation.y = rotationY
      lintel.castShadow = true
      parent.add(lintel)
    }
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
      record.state === 'locked' ? 'MAT_CHARCOAL' : 'MAT_BEIGE_TECH',
      { roughness: 0.62 },
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
    getMaterial('MAT_CONCRETE', { roughness: 0.85 }),
  )
  mesh.position.set(x, height / 2, z)
  mesh.castShadow = true
  parent.add(mesh)
  colliders.addAabb(nextId('col'), 'wall', x, height / 2, z, 0.4, height, 0.4)
  return mesh
}

/** Recessed fluorescent panel — queued for InstancedMesh when batching */
export function createCeilingLight(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  color = 0xe8eef2,
  _intensity = 2.2,
): THREE.Object3D | null {
  void _intensity
  if (isWorldBatching()) {
    queueCeilingPanel(x, y, z)
    return null
  }
  const g = new THREE.Group()
  g.position.set(x, y, z)
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.06, 1.4),
    getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.35 }),
  )
  housing.position.y = -0.015
  g.add(housing)
  const diffuser = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 1.22),
    getMaterial('MAT_WARM_WHITE', {
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 1.05,
      side: THREE.DoubleSide,
    }),
  )
  diffuser.rotation.x = Math.PI / 2
  diffuser.position.y = -0.05
  g.add(diffuser)
  parent.add(g)
  return g
}

/** Sparse realtime fill lights for the office (call a few times only) */
export function createRoomFillLight(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  color = 0xe0e8f0,
  intensity = 1.8,
  distance = 16,
): THREE.PointLight {
  const light = new THREE.PointLight(color, intensity, distance, 2)
  light.position.set(x, y, z)
  light.castShadow = false
  parent.add(light)
  return light
}

/** Large bold slogan painted on a wall plane */
export function createWallSlogan(
  parent: THREE.Object3D,
  lines: string[],
  x: number,
  y: number,
  z: number,
  rotationY: number,
  width = 3.2,
  height = 0.9,
): THREE.Mesh {
  const tex = sloganTexture(lines, { width: 1024, height: 384 })
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    roughness: 0.95,
    metalness: 0,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat)
  mesh.position.set(x, y, z)
  mesh.rotation.y = rotationY
  parent.add(mesh)
  return mesh
}

/** Cubicle-style low partition */
export function createCubiclePartition(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  length: number,
  rotationY: number,
  height = 1.15,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const panel = new THREE.Mesh(
    new RoundedBoxGeometry(length, height, 0.06, 2, 0.02),
    getMaterial('MAT_STEEL', { roughness: 0.75 }),
  )
  panel.position.y = height / 2
  panel.castShadow = true
  g.add(panel)

  const fabric = new THREE.Mesh(
    new RoundedBoxGeometry(length - 0.08, height - 0.2, 0.04, 1, 0.01),
    getMaterial('MAT_LAVENDER_GREY', { roughness: 0.92 }),
  )
  fabric.position.y = height / 2
  g.add(fabric)

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.04, 0.08),
    getMaterial('MAT_CHARCOAL', { roughness: 0.5 }),
  )
  trim.position.y = height
  g.add(trim)

  parent.add(g)
  const cos = Math.abs(Math.cos(rotationY))
  const sin = Math.abs(Math.sin(rotationY))
  colliders.addAabb(
    nextId('part'),
    'furniture',
    x,
    height / 2,
    z,
    length * cos + 0.1 * sin,
    height,
    length * sin + 0.1 * cos,
  )
  return g
}
