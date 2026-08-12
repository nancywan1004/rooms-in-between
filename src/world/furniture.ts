import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { getMaterial } from '../theme/materials'
import { crtScreenTexture, noticeBoardTexture } from '../theme/textures'
import type { ColliderWorld } from './colliders'

let seq = 0
const nid = (p: string) => `${p}_${++seq}`

function addCrtMonitor(parent: THREE.Object3D, x: number, y: number, z: number): void {
  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.36, 0.32, 3, 0.025),
    getMaterial('MAT_BEIGE_TECH', { roughness: 0.55 }),
  )
  bezel.position.set(x, y, z)
  bezel.castShadow = true
  parent.add(bezel)

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.24),
    new THREE.MeshStandardMaterial({
      map: crtScreenTexture(),
      emissive: 0x1a4030,
      emissiveIntensity: 0.55,
      roughness: 0.4,
    }),
  )
  screen.position.set(x, y + 0.02, z + 0.165)
  parent.add(screen)

  const stand = new THREE.Mesh(
    new RoundedBoxGeometry(0.22, 0.06, 0.18, 1, 0.01),
    getMaterial('MAT_BEIGE_TECH', { roughness: 0.55 }),
  )
  stand.position.set(x, y - 0.2, z)
  parent.add(stand)

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.08, 8),
    getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.3 }),
  )
  neck.position.set(x, y - 0.15, z)
  parent.add(neck)
}

function addDeskLamp(parent: THREE.Object3D, x: number, y: number, z: number): THREE.PointLight {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.02, 10),
    getMaterial('MAT_CHARCOAL', { roughness: 0.5 }),
  )
  base.position.set(x, y, z)
  parent.add(base)

  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6),
    getMaterial('MAT_STEEL', { roughness: 0.4, metalness: 0.4 }),
  )
  arm.position.set(x, y + 0.14, z)
  arm.rotation.z = 0.35
  parent.add(arm)

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.07, 10, 1, true),
    getMaterial('MAT_BLUSH', { roughness: 0.7, side: THREE.DoubleSide }),
  )
  shade.position.set(x + 0.08, y + 0.26, z)
  parent.add(shade)

  const bulb = new THREE.PointLight(0xffcc99, 0.55, 2.5, 2)
  bulb.position.set(x + 0.08, y + 0.24, z)
  parent.add(bulb)
  return bulb
}

function addFeminineAccents(parent: THREE.Object3D, y: number): void {
  // Pastel notebook
  const note = new THREE.Mesh(
    new RoundedBoxGeometry(0.12, 0.015, 0.16, 1, 0.005),
    getMaterial('MAT_LILAC', { roughness: 0.8 }),
  )
  note.position.set(0.35, y, 0.15)
  parent.add(note)

  // Tiny plush bunny silhouette
  const bunny = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 6),
    getMaterial('MAT_BLUSH', { roughness: 0.9 }),
  )
  bunny.position.set(-0.45, y + 0.03, 0.2)
  parent.add(bunny)
  const ear = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.012, 0.03, 2, 6),
    getMaterial('MAT_BLUSH', { roughness: 0.9 }),
  )
  ear.position.set(-0.45, y + 0.07, 0.2)
  parent.add(ear)

  // Sticky note
  const sticky = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.06),
    getMaterial('MAT_CORAL', { roughness: 0.85 }),
  )
  sticky.position.set(0.15, y + 0.001, 0.22)
  sticky.rotation.x = -Math.PI / 2
  parent.add(sticky)
}

/** Desk 1.4 × 0.7m with CRT + optional feminine accents */
export function createDesk(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  rotationY = 0,
  withCollider = true,
  withAccents = false,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const top = new THREE.Mesh(
    new RoundedBoxGeometry(1.4, 0.04, 0.7, 2, 0.015),
    getMaterial('MAT_DESK', { roughness: 0.7 }),
  )
  top.position.y = 0.72
  top.castShadow = true
  top.receiveShadow = true
  g.add(top)

  // Pedestal drawer unit (one side)
  const pedestal = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.65, 0.62, 2, 0.015),
    getMaterial('MAT_BEIGE_TECH', { roughness: 0.65 }),
  )
  pedestal.position.set(-0.45, 0.325, 0)
  pedestal.castShadow = true
  g.add(pedestal)
  for (let i = 0; i < 3; i++) {
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.015, 0.02),
      getMaterial('MAT_STEEL', { roughness: 0.4, metalness: 0.35 }),
    )
    handle.position.set(-0.45, 0.18 + i * 0.18, 0.32)
    g.add(handle)
  }

  const leg = new THREE.Mesh(
    new RoundedBoxGeometry(0.05, 0.68, 0.05, 1, 0.008),
    getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.35 }),
  )
  leg.position.set(0.6, 0.34, 0.28)
  g.add(leg)
  const leg2 = leg.clone()
  leg2.position.set(0.6, 0.34, -0.28)
  g.add(leg2)

  addCrtMonitor(g, 0.05, 0.98, -0.12)

  // Keyboard
  const kb = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.03, 0.14, 1, 0.008),
    getMaterial('MAT_BEIGE_TECH', { roughness: 0.6 }),
  )
  kb.position.set(0.05, 0.75, 0.18)
  g.add(kb)

  // Phone
  const phone = new THREE.Mesh(
    new RoundedBoxGeometry(0.14, 0.06, 0.18, 2, 0.01),
    getMaterial('MAT_CHARCOAL', { roughness: 0.55 }),
  )
  phone.position.set(0.5, 0.76, -0.15)
  g.add(phone)

  addDeskLamp(g, -0.5, 0.74, -0.2)

  if (withAccents) addFeminineAccents(g, 0.75)

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
    new RoundedBoxGeometry(0.48, 0.07, 0.48, 3, 0.03),
    getMaterial('MAT_CHAIR', { roughness: 0.75 }),
  )
  seat.position.y = 0.45
  seat.castShadow = true
  g.add(seat)

  const back = new THREE.Mesh(
    new RoundedBoxGeometry(0.46, 0.48, 0.07, 3, 0.03),
    getMaterial('MAT_CHAIR', { roughness: 0.75 }),
  )
  back.position.set(0, 0.72, -0.22)
  g.add(back)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.05, 12),
    getMaterial('MAT_STEEL', { roughness: 0.4, metalness: 0.45 }),
  )
  base.position.y = 0.04
  g.add(base)

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.38, 8),
    getMaterial('MAT_STEEL', { roughness: 0.4, metalness: 0.45 }),
  )
  stem.position.y = 0.24
  g.add(stem)

  // Five-star base feet
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.03, 0.04),
      getMaterial('MAT_STEEL', { roughness: 0.4, metalness: 0.45 }),
    )
    foot.position.set(Math.cos(a) * 0.12, 0.03, Math.sin(a) * 0.12)
    foot.rotation.y = -a
    g.add(foot)
  }

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
    new RoundedBoxGeometry(0.9, 1.5, 0.48, 2, 0.02),
    getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.35 }),
  )
  body.position.y = 0.75
  body.castShadow = true
  g.add(body)

  for (let i = 0; i < 4; i++) {
    const drawer = new THREE.Mesh(
      new RoundedBoxGeometry(0.82, 0.32, 0.02, 1, 0.005),
      getMaterial('MAT_STEEL', { roughness: 0.5, metalness: 0.3 }),
    )
    drawer.position.set(0, 0.28 + i * 0.36, 0.25)
    g.add(drawer)
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.02, 0.03),
      getMaterial('MAT_CHARCOAL', { roughness: 0.4 }),
    )
    handle.position.set(0, 0.28 + i * 0.36, 0.28)
    g.add(handle)
  }

  parent.add(g)
  const cos = Math.abs(Math.cos(rotationY))
  const sin = Math.abs(Math.sin(rotationY))
  colliders.addAabb(
    nid('cab'),
    'cabinet',
    x,
    0.75,
    z,
    0.9 * cos + 0.48 * sin,
    1.5,
    0.9 * sin + 0.48 * cos,
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
    new RoundedBoxGeometry(1.15, 0.85, 0.85, 3, 0.04),
    getMaterial('MAT_BEIGE_TECH', { roughness: 0.55 }),
  )
  body.position.y = 0.5
  body.castShadow = true
  g.add(body)

  const lid = new THREE.Mesh(
    new RoundedBoxGeometry(1.05, 0.08, 0.7, 2, 0.02),
    getMaterial('MAT_BEIGE_TECH', { roughness: 0.5 }),
  )
  lid.position.set(0, 0.98, -0.05)
  g.add(lid)

  const tray = new THREE.Mesh(
    new RoundedBoxGeometry(0.75, 0.04, 0.4, 1, 0.01),
    getMaterial('MAT_PAPER', { roughness: 0.7 }),
  )
  tray.position.set(0, 0.35, 0.5)
  g.add(tray)

  const panel = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.2, 0.05, 1, 0.01),
    getMaterial('MAT_CHARCOAL', {
      roughness: 0.4,
      emissive: 0x2a4038,
      emissiveIntensity: 0.35,
    }),
  )
  panel.position.set(0.3, 0.95, 0.35)
  panel.rotation.x = -0.35
  g.add(panel)

  parent.add(g)
  colliders.addAabb(nid('printer'), 'printer', x, 0.55, z, 1.2, 1.1, 0.95)
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
    getMaterial('MAT_DESK', { roughness: 0.7 }),
  )
  desk.position.y = 0.75
  desk.castShadow = true
  g.add(desk)

  for (const lx of [-0.4, 0.4]) {
    const leg = new THREE.Mesh(
      new RoundedBoxGeometry(0.05, 0.72, 0.05, 1, 0.01),
      getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.3 }),
    )
    leg.position.set(lx, 0.36, 0)
    g.add(leg)
  }

  addCrtMonitor(g, 0, 1.05, -0.05)

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
    new RoundedBoxGeometry(1.2, 0.9, 0.05, 2, 0.015),
    new THREE.MeshStandardMaterial({
      map: noticeBoardTexture(),
      roughness: 0.85,
      metalness: 0,
    }),
  )
  board.position.y = 1.5
  g.add(board)

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.98, 0.03),
    getMaterial('MAT_CHARCOAL', { roughness: 0.6 }),
  )
  frame.position.set(0, 1.5, -0.02)
  g.add(frame)

  const stand = new THREE.Mesh(
    new RoundedBoxGeometry(0.08, 1.1, 0.08, 1, 0.01),
    getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.3 }),
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
