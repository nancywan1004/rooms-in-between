import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { getMaterial } from '../theme/materials'
import type { ColliderWorld } from './colliders'

let seq = 0
const nid = (p: string) => `${p}_${++seq}`

/** Desk 1.4 × 0.7m, pivot floor-contact center */
export function createDesk(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  rotationY = 0,
  withCollider = true,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const top = new THREE.Mesh(
    new RoundedBoxGeometry(1.4, 0.05, 0.7, 2, 0.02),
    getMaterial('MAT_DESK', { roughness: 0.65 }),
  )
  top.position.y = 0.72
  top.castShadow = true
  top.receiveShadow = true
  g.add(top)

  const legGeo = new RoundedBoxGeometry(0.06, 0.7, 0.06, 1, 0.01)
  const legMat = getMaterial('MAT_LAVENDER_GREY', { roughness: 0.5 })
  for (const [lx, lz] of [
    [-0.6, -0.28],
    [0.6, -0.28],
    [-0.6, 0.28],
    [0.6, 0.28],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, legMat)
    leg.position.set(lx, 0.35, lz)
    leg.castShadow = true
    g.add(leg)
  }

  // Monitor
  const monitor = new THREE.Mesh(
    new RoundedBoxGeometry(0.45, 0.3, 0.04, 1, 0.01),
    getMaterial('MAT_CHARCOAL', { roughness: 0.4 }),
  )
  monitor.position.set(0, 0.95, -0.1)
  g.add(monitor)

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.25),
    getMaterial('MAT_DUSTY_BLUE', { roughness: 0.3, emissive: 0x4a6070, emissiveIntensity: 0.25 }),
  )
  screen.position.set(0, 0.95, -0.078)
  g.add(screen)

  parent.add(g)

  if (withCollider) {
    const cos = Math.abs(Math.cos(rotationY))
    const sin = Math.abs(Math.sin(rotationY))
    const sx = 1.4 * cos + 0.7 * sin
    const sz = 1.4 * sin + 0.7 * cos
    colliders.addAabb(nid('desk'), 'desk', x, 0.4, z, sx, 0.8, sz)
  }
  return g
}

export function createChair(
  parent: THREE.Object3D,
  x: number,
  z: number,
  rotationY = 0,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const seat = new THREE.Mesh(
    new RoundedBoxGeometry(0.45, 0.06, 0.45, 2, 0.02),
    getMaterial('MAT_CHAIR', { roughness: 0.7 }),
  )
  seat.position.y = 0.42
  seat.castShadow = true
  g.add(seat)

  const back = new THREE.Mesh(
    new RoundedBoxGeometry(0.45, 0.4, 0.06, 2, 0.02),
    getMaterial('MAT_CHAIR', { roughness: 0.7 }),
  )
  back.position.set(0, 0.65, -0.2)
  g.add(back)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.06, 12),
    getMaterial('MAT_LAVENDER_GREY', { roughness: 0.5 }),
  )
  base.position.y = 0.05
  g.add(base)

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8),
    getMaterial('MAT_LAVENDER_GREY', { roughness: 0.5 }),
  )
  stem.position.y = 0.24
  g.add(stem)

  parent.add(g)
  return g
}

export function createCabinet(
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
    new RoundedBoxGeometry(1.0, 1.4, 0.45, 2, 0.03),
    getMaterial('MAT_LAVENDER_GREY', { roughness: 0.68 }),
  )
  body.position.y = 0.7
  body.castShadow = true
  g.add(body)

  parent.add(g)
  const cos = Math.abs(Math.cos(rotationY))
  const sin = Math.abs(Math.sin(rotationY))
  colliders.addAabb(
    nid('cab'),
    'cabinet',
    x,
    0.7,
    z,
    1.0 * cos + 0.45 * sin,
    1.4,
    1.0 * sin + 0.45 * cos,
  )
  return g
}

export function createPrinter(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(1.1, 1.0, 0.8, 3, 0.04),
    getMaterial('MAT_DUSTY_BLUE', { roughness: 0.55 }),
  )
  body.position.y = 0.55
  body.castShadow = true
  g.add(body)

  const tray = new THREE.Mesh(
    new RoundedBoxGeometry(0.7, 0.05, 0.35, 1, 0.01),
    getMaterial('MAT_WARM_WHITE', { roughness: 0.6 }),
  )
  tray.position.set(0, 0.35, 0.45)
  g.add(tray)

  const screen = new THREE.Mesh(
    new RoundedBoxGeometry(0.35, 0.22, 0.04, 1, 0.01),
    getMaterial('MAT_CHARCOAL', { roughness: 0.4, emissive: 0x3a5060, emissiveIntensity: 0.4 }),
  )
  screen.position.set(0.25, 1.05, 0.3)
  screen.rotation.x = -0.3
  g.add(screen)

  parent.add(g)
  colliders.addAabb(nid('printer'), 'printer', x, 0.55, z, 1.15, 1.1, 0.9)
  return g
}

export function createTerminal(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  rotationY = 0,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const desk = new THREE.Mesh(
    new RoundedBoxGeometry(1.0, 0.05, 0.55, 2, 0.02),
    getMaterial('MAT_DESK', { roughness: 0.65 }),
  )
  desk.position.y = 0.75
  desk.castShadow = true
  g.add(desk)

  for (const lx of [-0.4, 0.4]) {
    const leg = new THREE.Mesh(
      new RoundedBoxGeometry(0.05, 0.72, 0.05, 1, 0.01),
      getMaterial('MAT_LAVENDER_GREY'),
    )
    leg.position.set(lx, 0.36, 0)
    g.add(leg)
  }

  const monitor = new THREE.Mesh(
    new RoundedBoxGeometry(0.5, 0.35, 0.05, 1, 0.01),
    getMaterial('MAT_CHARCOAL', { roughness: 0.35, emissive: 0x2a4050, emissiveIntensity: 0.5 }),
  )
  monitor.position.set(0, 1.05, -0.05)
  g.add(monitor)

  parent.add(g)
  colliders.addAabb(nid('term'), 'furniture', x, 0.4, z, 1.05, 0.85, 0.6)
  return g
}

export function createPaperStack(parent: THREE.Object3D, x: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(0.3, 0.12, 0.22, 1, 0.01),
    getMaterial('MAT_WARM_WHITE', { roughness: 0.9 }),
  )
  mesh.position.set(x, 0.06, z)
  parent.add(mesh)
  return mesh
}

export function createPlant(
  parent: THREE.Object3D,
  x: number,
  z: number,
  large = false,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  const scale = large ? 1.35 : 1

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * scale, 0.14 * scale, 0.28 * scale, 10),
    getMaterial('MAT_POT', { roughness: 0.75 }),
  )
  pot.position.y = 0.14 * scale
  g.add(pot)

  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(0.32 * scale, 10, 8),
    getMaterial('MAT_PLANT', { roughness: 0.85 }),
  )
  foliage.position.y = 0.5 * scale
  foliage.scale.y = 1.15
  foliage.castShadow = true
  g.add(foliage)

  parent.add(g)
  return g
}

export function createMeetingTable(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const top = new THREE.Mesh(
    new RoundedBoxGeometry(4.5, 0.08, 1.4, 3, 0.04),
    getMaterial('MAT_DESK', { roughness: 0.6 }),
  )
  top.position.y = 0.74
  top.castShadow = true
  g.add(top)

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(3.2, 0.7, 0.5, 2, 0.03),
    getMaterial('MAT_LAVENDER_GREY', { roughness: 0.55 }),
  )
  base.position.y = 0.35
  g.add(base)

  parent.add(g)
  colliders.addAabb(nid('mtable'), 'furniture', x, 0.4, z, 4.5, 0.8, 1.4)
  return g
}

export function createBreakTable(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16),
    getMaterial('MAT_SAGE', { roughness: 0.65 }),
  )
  top.position.y = 0.72
  top.castShadow = true
  g.add(top)

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.7, 10),
    getMaterial('MAT_LAVENDER_GREY'),
  )
  stem.position.y = 0.35
  g.add(stem)

  parent.add(g)
  colliders.addAabb(nid('btable'), 'furniture', x, 0.4, z, 0.95, 0.8, 0.95)
  return g
}

export function createCoffeeCounter(
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
    new RoundedBoxGeometry(2.2, 0.9, 0.6, 2, 0.03),
    getMaterial('MAT_SAGE', { roughness: 0.7 }),
  )
  body.position.y = 0.45
  body.castShadow = true
  g.add(body)

  const machine = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.5, 0.35, 2, 0.02),
    getMaterial('MAT_CHARCOAL', { roughness: 0.45 }),
  )
  machine.position.set(-0.5, 1.15, 0)
  g.add(machine)

  parent.add(g)
  const cos = Math.abs(Math.cos(rotationY))
  const sin = Math.abs(Math.sin(rotationY))
  colliders.addAabb(
    nid('coffee'),
    'furniture',
    x,
    0.45,
    z,
    2.2 * cos + 0.6 * sin,
    0.9,
    2.2 * sin + 0.6 * cos,
  )
  return g
}

export function createWaterCooler(parent: THREE.Object3D, colliders: ColliderWorld, x: number, z: number): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.9, 0.4, 2, 0.02),
    getMaterial('MAT_WARM_WHITE', { roughness: 0.55 }),
  )
  base.position.y = 0.45
  base.castShadow = true
  g.add(base)

  const jug = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    getMaterial('MAT_DUSTY_BLUE', { roughness: 0.2, transparent: true, opacity: 0.55 }),
  )
  jug.position.y = 1.15
  g.add(jug)

  parent.add(g)
  colliders.addAabb(nid('water'), 'furniture', x, 0.6, z, 0.45, 1.2, 0.45)
  return g
}

export function createSuggestionBox(parent: THREE.Object3D, x: number, z: number): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const box = new THREE.Mesh(
    new RoundedBoxGeometry(0.35, 0.4, 0.35, 2, 0.02),
    getMaterial('MAT_CORAL', { roughness: 0.6 }),
  )
  box.position.y = 0.55
  box.castShadow = true
  g.add(box)

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
    getMaterial('MAT_LAVENDER_GREY'),
  )
  stand.position.y = 0.18
  g.add(stand)

  parent.add(g)
  return g
}

export function createCup(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Mesh {
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.035, 0.09, 10),
    getMaterial('MAT_CORAL', { roughness: 0.55 }),
  )
  cup.position.set(x, y, z)
  parent.add(cup)
  return cup
}

export function createProposal(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(0.28, 0.02, 0.36, 1, 0.005),
    getMaterial('MAT_GOLD', { roughness: 0.5 }),
  )
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function createHandbook(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(0.22, 0.04, 0.28, 1, 0.01),
    getMaterial('MAT_DUSTY_BLUE', { roughness: 0.7 }),
  )
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function createEvidenceCard(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(0.15, 0.01, 0.22, 1, 0.002),
    getMaterial('MAT_WARM_WHITE', { roughness: 0.85 }),
  )
  mesh.position.set(x, y, z)
  mesh.rotation.y = Math.random() * 0.5
  parent.add(mesh)
  return mesh
}

export function createNpc(
  parent: THREE.Object3D,
  x: number,
  z: number,
  colorKey: 'MAT_NPC' | 'MAT_MANAGER' = 'MAT_NPC',
  height = 1.7,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, height - 0.55, 4, 8),
    getMaterial(colorKey, { roughness: 0.7 }),
  )
  body.position.y = height / 2
  body.castShadow = true
  g.add(body)

  // Faceless head hint — same color, slightly larger
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    getMaterial(colorKey, { roughness: 0.65 }),
  )
  head.position.y = height - 0.12
  g.add(head)

  parent.add(g)
  return g
}

export function createComplianceNotice(parent: THREE.Object3D, x: number, z: number, rotationY = 0): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const board = new THREE.Mesh(
    new RoundedBoxGeometry(1.2, 0.9, 0.05, 2, 0.02),
    getMaterial('MAT_WARM_WHITE', { roughness: 0.8 }),
  )
  board.position.y = 1.5
  g.add(board)

  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.08, 0.06),
    getMaterial('MAT_CORAL', { roughness: 0.5 }),
  )
  accent.position.set(0, 1.88, 0.01)
  g.add(accent)

  const stand = new THREE.Mesh(
    new RoundedBoxGeometry(0.08, 1.1, 0.08, 1, 0.01),
    getMaterial('MAT_LAVENDER_GREY'),
  )
  stand.position.y = 0.55
  g.add(stand)

  parent.add(g)
  return g
}

export function createManagerDesk(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)

  const top = new THREE.Mesh(
    new RoundedBoxGeometry(2.2, 0.06, 0.9, 3, 0.03),
    getMaterial('MAT_CHARCOAL', { roughness: 0.55 }),
  )
  top.position.y = 0.76
  top.castShadow = true
  g.add(top)

  const pedestal = new THREE.Mesh(
    new RoundedBoxGeometry(1.8, 0.7, 0.6, 2, 0.03),
    getMaterial('MAT_ACCENT_MANAGER', { roughness: 0.6 }),
  )
  pedestal.position.y = 0.35
  g.add(pedestal)

  parent.add(g)
  colliders.addAabb(nid('mdesk'), 'desk', x, 0.4, z, 2.2, 0.8, 0.9)
  return g
}

export function createSofa(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  rotationY = 0,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const seat = new THREE.Mesh(
    new RoundedBoxGeometry(1.6, 0.35, 0.7, 3, 0.05),
    getMaterial('MAT_SAGE', { roughness: 0.8 }),
  )
  seat.position.y = 0.3
  seat.castShadow = true
  g.add(seat)

  const back = new THREE.Mesh(
    new RoundedBoxGeometry(1.6, 0.5, 0.2, 2, 0.04),
    getMaterial('MAT_SAGE', { roughness: 0.8 }),
  )
  back.position.set(0, 0.6, -0.25)
  g.add(back)

  parent.add(g)
  const cos = Math.abs(Math.cos(rotationY))
  const sin = Math.abs(Math.sin(rotationY))
  colliders.addAabb(
    nid('sofa'),
    'furniture',
    x,
    0.35,
    z,
    1.6 * cos + 0.7 * sin,
    0.7,
    1.6 * sin + 0.7 * cos,
  )
  return g
}
