import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { getMaterial } from '../theme/materials'
import { vendingLabelTexture, wallFrameTexture } from '../theme/textures'
import type { ColliderWorld } from './colliders'

let seq = 0
const nid = (p: string) => `${p}_${++seq}`

/** "Refresh" vending machine — Break Room hero prop */
export function createVendingMachine(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  rotationY = 0,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.95, 1.9, 0.7, 2, 0.03),
    getMaterial('MAT_STEEL', { roughness: 0.4, metalness: 0.35 }),
  )
  body.position.y = 0.95
  body.castShadow = true
  g.add(body)

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 1.2),
    getMaterial('MAT_GLASS', {
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    }),
  )
  glass.position.set(0, 1.15, 0.36)
  g.add(glass)

  // Product rows (silhouette blocks)
  const colors = ['MAT_CORAL', 'MAT_BLUSH', 'MAT_SAGE', 'MAT_LILAC', 'MAT_DUSTY_BLUE'] as const
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const can = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8),
        getMaterial(colors[(row + col) % colors.length], { roughness: 0.5 }),
      )
      can.position.set(-0.2 + col * 0.2, 1.45 - row * 0.28, 0.28)
      g.add(can)
    }
  }

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.16),
    new THREE.MeshStandardMaterial({
      map: vendingLabelTexture(),
      roughness: 0.6,
      metalness: 0.1,
    }),
  )
  label.position.set(0, 1.85, 0.36)
  g.add(label)

  const tray = new THREE.Mesh(
    new RoundedBoxGeometry(0.55, 0.12, 0.2, 1, 0.01),
    getMaterial('MAT_CHARCOAL', { roughness: 0.55 }),
  )
  tray.position.set(0, 0.28, 0.4)
  g.add(tray)

  parent.add(g)
  const cos = Math.abs(Math.cos(rotationY))
  const sin = Math.abs(Math.sin(rotationY))
  colliders.addAabb(
    nid('vend'),
    'furniture',
    x,
    0.95,
    z,
    0.95 * cos + 0.7 * sin,
    1.9,
    0.95 * sin + 0.7 * cos,
  )
  return g
}

/** Dried lavender in a small vase — feminine dressing */
export function createLavenderVase(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)

  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 0.1, 8),
    getMaterial('MAT_CREAM', { roughness: 0.7 }),
  )
  vase.position.y = 0.05
  g.add(vase)

  for (let i = 0; i < 5; i++) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.18, 4),
      getMaterial('MAT_PLANT', { roughness: 0.8 }),
    )
    const a = (i / 5) * Math.PI * 2
    stem.position.set(Math.cos(a) * 0.012, 0.16, Math.sin(a) * 0.012)
    stem.rotation.z = Math.cos(a) * 0.15
    stem.rotation.x = Math.sin(a) * 0.15
    g.add(stem)

    const bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 6, 5),
      getMaterial('MAT_LILAC', { roughness: 0.85 }),
    )
    bud.position.set(Math.cos(a) * 0.02, 0.26, Math.sin(a) * 0.02)
    bud.scale.set(0.7, 1.4, 0.7)
    g.add(bud)
  }

  parent.add(g)
  return g
}

/** Framed corporate photo / abstract on wall */
export function createWallFrame(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  rotationY: number,
  w = 0.7,
  h = 0.5,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = rotationY

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(w + 0.06, h + 0.06, 0.04, 1, 0.008),
    getMaterial('MAT_CHARCOAL', { roughness: 0.55 }),
  )
  g.add(frame)

  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: wallFrameTexture(),
      roughness: 0.9,
    }),
  )
  art.position.z = 0.022
  g.add(art)

  parent.add(g)
  return g
}

/** High clerestory window with sheer curtain */
export function createHighWindow(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  rotationY: number,
  width = 1.6,
  height = 0.55,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = rotationY

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(width + 0.08, height + 0.08, 0.08, 1, 0.01),
    getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.3 }),
  )
  g.add(frame)

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    getMaterial('MAT_GLASS', {
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.25,
      emissive: 0xa8b8c4,
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    }),
  )
  glass.position.z = 0.02
  g.add(glass)

  // Sheer curtain — soft blush/white plane, slightly translucent
  const sheer = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.95, height * 1.15),
    getMaterial('MAT_BLUSH', {
      roughness: 0.95,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    }),
  )
  sheer.position.set(0.05, -0.05, 0.05)
  sheer.rotation.z = 0.04
  g.add(sheer)

  parent.add(g)
  return g
}

/** Floor trash bin */
export function createTrashBin(parent: THREE.Object3D, x: number, z: number): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const bin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.12, 0.35, 12),
    getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.4 }),
  )
  bin.position.y = 0.175
  bin.castShadow = true
  g.add(bin)

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.012, 6, 16),
    getMaterial('MAT_CHARCOAL', { roughness: 0.5 }),
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.34
  g.add(rim)

  parent.add(g)
  return g
}

/** Paper rack / shelf for printer room */
export function createPaperRack(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  rotationY = 0,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(0.7, 1.2, 0.35, 2, 0.015),
    getMaterial('MAT_BEIGE_TECH', { roughness: 0.65 }),
  )
  frame.position.y = 0.6
  frame.castShadow = true
  g.add(frame)

  for (let i = 0; i < 4; i++) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.02, 0.3),
      getMaterial('MAT_STEEL', { roughness: 0.5, metalness: 0.2 }),
    )
    shelf.position.set(0, 0.2 + i * 0.28, 0)
    g.add(shelf)

    const paper = new THREE.Mesh(
      new RoundedBoxGeometry(0.28, 0.06 + (i % 2) * 0.04, 0.22, 1, 0.005),
      getMaterial('MAT_PAPER', { roughness: 0.9 }),
    )
    paper.position.set(-0.1 + (i % 2) * 0.2, 0.25 + i * 0.28, 0.02)
    g.add(paper)
  }

  parent.add(g)
  const cos = Math.abs(Math.cos(rotationY))
  const sin = Math.abs(Math.sin(rotationY))
  colliders.addAabb(
    nid('rack'),
    'furniture',
    x,
    0.6,
    z,
    0.7 * cos + 0.35 * sin,
    1.2,
    0.7 * sin + 0.35 * cos,
  )
  return g
}

/** Personalized mug with handle */
export function createPersonalizedMug(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  color: 'MAT_BLUSH' | 'MAT_CORAL' | 'MAT_LILAC' | 'MAT_SAGE' = 'MAT_BLUSH',
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.032, 0.09, 12),
    getMaterial(color, { roughness: 0.55 }),
  )
  body.position.y = 0.045
  g.add(body)

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.028, 0.008, 6, 12, Math.PI),
    getMaterial(color, { roughness: 0.55 }),
  )
  handle.position.set(0.045, 0.045, 0)
  handle.rotation.y = Math.PI / 2
  g.add(handle)

  parent.add(g)
  return g
}

/** Analog wall clock */
export function createWallClock(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  rotationY: number,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = rotationY

  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24),
    getMaterial('MAT_PAPER', { roughness: 0.7 }),
  )
  face.rotation.x = Math.PI / 2
  g.add(face)

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.015, 6, 24),
    getMaterial('MAT_CHARCOAL', { roughness: 0.5 }),
  )
  g.add(rim)

  const hour = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.1, 0.01),
    getMaterial('MAT_CHARCOAL', { roughness: 0.5 }),
  )
  hour.position.set(0.02, 0.04, 0.025)
  hour.rotation.z = -0.4
  g.add(hour)

  const minute = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.14, 0.01),
    getMaterial('MAT_CHARCOAL', { roughness: 0.5 }),
  )
  minute.position.set(-0.03, 0.05, 0.025)
  minute.rotation.z = 0.6
  g.add(minute)

  parent.add(g)
  return g
}

/** Low potted dried plant cluster for corners */
export function createFloorPlanter(
  parent: THREE.Object3D,
  x: number,
  z: number,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.35, 10),
    getMaterial('MAT_CONCRETE', { roughness: 0.85 }),
  )
  pot.position.y = 0.175
  pot.castShadow = true
  g.add(pot)

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.04, 10),
    getMaterial('MAT_CHARCOAL', { roughness: 0.9 }),
  )
  soil.position.y = 0.36
  g.add(soil)

  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 6),
      getMaterial('MAT_PLANT', { roughness: 0.88 }),
    )
    const a = (i / 3) * Math.PI * 2
    leaf.position.set(Math.cos(a) * 0.08, 0.55, Math.sin(a) * 0.08)
    leaf.scale.set(1, 1.3, 0.8)
    leaf.castShadow = true
    g.add(leaf)
  }

  parent.add(g)
  return g
}
