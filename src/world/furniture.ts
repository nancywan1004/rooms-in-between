import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { getMaterial, deskMaterial, plasticMaterial, metalMaterial, crtScreenMaterial } from '../theme/materials'
import { noticeBoardTexture } from '../theme/textures'
import type { ColliderWorld } from './colliders'
import { buildChairGeometry, isWorldBatching, queueChair } from './batching'
import { cloneOfficeAsset, deskSurfaceY, isOfficePackReady } from './officePack'

let seq = 0
const nid = (p: string) => `${p}_${++seq}`

function addCrtMonitor(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Mesh {
  const plastic = plasticMaterial()
  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.36, 0.38, 2, 0.025),
    plastic,
  )
  bezel.position.set(x, y, z)
  bezel.castShadow = true
  parent.add(bezel)

  const recess = new THREE.Mesh(
    new RoundedBoxGeometry(0.34, 0.26, 0.04, 1, 0.008),
    getMaterial('MAT_CHARCOAL', { roughness: 0.9 }),
  )
  recess.position.set(x, y + 0.01, z + 0.17)
  parent.add(recess)

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), crtScreenMaterial())
  screen.position.set(x, y + 0.02, z + 0.195)
  screen.userData.isCrt = true
  screen.userData.baseEmissive = 0.65
  parent.add(screen)

  const stand = new THREE.Mesh(
    new RoundedBoxGeometry(0.24, 0.05, 0.2, 1, 0.01),
    plastic,
  )
  stand.position.set(x, y - 0.22, z)
  parent.add(stand)

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.1, 8),
    metalMaterial(),
  )
  neck.position.set(x, y - 0.16, z)
  parent.add(neck)

  return screen
}

function addDeskLamp(parent: THREE.Object3D, x: number, y: number, z: number): void {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.02, 8),
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
    new THREE.CylinderGeometry(0.06, 0.08, 0.07, 8, 1, true),
    getMaterial('MAT_BLUSH', {
      roughness: 0.7,
      side: THREE.DoubleSide,
      emissive: 0xffcc99,
      emissiveIntensity: 0.35,
    }),
  )
  shade.position.set(x + 0.08, y + 0.26, z)
  parent.add(shade)

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 6, 6),
    getMaterial('MAT_WARM_WHITE', {
      emissive: 0xffcc99,
      emissiveIntensity: 0.8,
      roughness: 0.4,
    }),
  )
  bulb.position.set(x + 0.08, y + 0.24, z)
  parent.add(bulb)
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
  const earL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.012, 0.03, 2, 6),
    getMaterial('MAT_BLUSH', { roughness: 0.9 }),
  )
  earL.position.set(-0.46, y + 0.07, 0.2)
  parent.add(earL)
  const earR = earL.clone()
  earR.position.set(-0.42, y + 0.07, 0.2)
  parent.add(earR)

  // Sticky notes with tiny heart hint
  const sticky = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.06),
    getMaterial('MAT_CORAL', { roughness: 0.85 }),
  )
  sticky.position.set(0.15, y + 0.001, 0.22)
  sticky.rotation.x = -Math.PI / 2
  parent.add(sticky)

  const sticky2 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.05),
    getMaterial('MAT_LILAC', { roughness: 0.85 }),
  )
  sticky2.position.set(0.22, y + 0.001, 0.18)
  sticky2.rotation.x = -Math.PI / 2
  sticky2.rotation.z = 0.2
  parent.add(sticky2)

  // Mini lavender
  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, 0.07, 6),
    getMaterial('MAT_CREAM', { roughness: 0.7 }),
  )
  vase.position.set(0.45, y + 0.035, -0.15)
  parent.add(vase)
  const bud = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 6, 5),
    getMaterial('MAT_LILAC', { roughness: 0.85 }),
  )
  bud.position.set(0.45, y + 0.1, -0.15)
  bud.scale.set(0.7, 1.5, 0.7)
  parent.add(bud)
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
  if (isOfficePackReady()) {
    return createDeskFromPack(parent, colliders, x, z, rotationY, withCollider, withAccents)
  }
  return createDeskProcedural(parent, colliders, x, z, rotationY, withCollider, withAccents)
}

function placePackProp(
  parent: THREE.Object3D,
  id: Parameters<typeof cloneOfficeAsset>[0],
  x: number,
  y: number,
  z: number,
  target: [number, number, number],
  yaw = 0,
): void {
  const prop = cloneOfficeAsset(id, { target, yaw })
  if (!prop) return
  prop.position.set(x, y, z)
  parent.add(prop)
}

function createDeskFromPack(
  parent: THREE.Object3D,
  colliders: ColliderWorld,
  x: number,
  z: number,
  rotationY: number,
  withCollider: boolean,
  withAccents: boolean,
): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  // Pack desk is long on Z; yaw so the run is along local X for cubicle width.
  const desk = cloneOfficeAsset('desk_big', { yaw: Math.PI / 2, target: [1.45, 0.74, 0.78] })
  if (!desk) return createDeskProcedural(parent, colliders, x, z, rotationY, withCollider, withAccents)
  g.add(desk)
  const topY = deskSurfaceY(desk)

  // Monitor faces the sitter (+Z / keyboard side).
  const useWide = Math.abs(Math.round(x * 3 + z * 5)) % 4 === 0
  placePackProp(
    g,
    useWide ? 'monitor_ultrawide' : 'monitor',
    0.05,
    topY,
    -0.08,
    useWide ? [0.72, 0.42, 0.18] : [0.52, 0.42, 0.18],
    Math.PI / 2,
  )
  placePackProp(g, 'lamp_architect', -0.52, topY, -0.12, [0.28, 0.48, 0.32], 0.35)
  placePackProp(g, 'keyboard', 0.02, topY, 0.18, [0.46, 0.028, 0.16], Math.PI / 2)
  placePackProp(g, 'wireless_mouse', 0.36, topY, 0.2, [0.07, 0.035, 0.11], Math.PI / 2)

  const variant = Math.abs(Math.round(x * 10 + z * 7)) % 3
  if (variant === 0 || withAccents) {
    placePackProp(g, 'mug', -0.35, topY, 0.22, [0.08, 0.09, 0.08], 0.2)
  }
  if (variant === 1 || withAccents) {
    placePackProp(g, 'pencil_holder', 0.52, topY, -0.18, [0.09, 0.1, 0.09], -0.4)
  }
  if (variant === 2) {
    placePackProp(g, 'pen', 0.28, topY, 0.12, [0.12, 0.012, 0.012], Math.PI / 2)
  }
  if (withAccents) addFeminineAccents(g, topY)

  parent.add(g)
  if (withCollider) {
    const cos = Math.abs(Math.cos(rotationY))
    const sin = Math.abs(Math.sin(rotationY))
    const sx = 1.45 * cos + 0.78 * sin
    const sz = 1.45 * sin + 0.78 * cos
    colliders.addAabb(nid('desk'), 'desk', x, 0.4, z, sx, 0.8, sz)
  }
  return g
}

function createDeskProcedural(
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
    new RoundedBoxGeometry(1.4, 0.04, 0.7, 3, 0.012),
    deskMaterial(2.2, 1.1),
  )
  top.position.y = 0.72
  top.castShadow = true
  top.receiveShadow = true
  g.add(top)

  // Front edge strip
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.025, 0.015),
    getMaterial('MAT_CHARCOAL', { roughness: 0.6 }),
  )
  edge.position.set(0, 0.7, 0.345)
  g.add(edge)

  // Pedestal drawer unit (one side)
  const pedestal = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.65, 0.62, 3, 0.015),
    plasticMaterial(),
  )
  pedestal.position.set(-0.45, 0.325, 0)
  pedestal.castShadow = true
  g.add(pedestal)
  for (let i = 0; i < 3; i++) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.008, 0.01),
      getMaterial('MAT_CHARCOAL', { roughness: 0.7 }),
    )
    seam.position.set(-0.45, 0.12 + i * 0.2, 0.31)
    g.add(seam)
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.012, 0.025),
      metalMaterial(),
    )
    handle.position.set(-0.45, 0.18 + i * 0.18, 0.325)
    g.add(handle)
  }

  const legMat = metalMaterial()
  const leg = new THREE.Mesh(
    new RoundedBoxGeometry(0.045, 0.68, 0.045, 1, 0.006),
    legMat,
  )
  leg.position.set(0.6, 0.34, 0.28)
  g.add(leg)
  const leg2 = leg.clone()
  leg2.position.set(0.6, 0.34, -0.28)
  g.add(leg2)

  // Modesty panel
  const modesty = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.35, 0.02),
    getMaterial('MAT_LAVENDER_GREY', { roughness: 0.85 }),
  )
  modesty.position.set(0.15, 0.35, -0.28)
  g.add(modesty)

  addCrtMonitor(g, 0.05, 0.98, -0.12)

  // Keyboard with keys hint
  const kb = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.028, 0.15, 2, 0.008),
    plasticMaterial(),
  )
  kb.position.set(0.05, 0.745, 0.18)
  g.add(kb)

  // Phone with cord stub
  const phone = new THREE.Mesh(
    new RoundedBoxGeometry(0.15, 0.055, 0.2, 2, 0.012),
    getMaterial('MAT_CHARCOAL', { roughness: 0.5 }),
  )
  phone.position.set(0.5, 0.76, -0.15)
  g.add(phone)
  const handset = new THREE.Mesh(
    new RoundedBoxGeometry(0.05, 0.04, 0.16, 2, 0.01),
    getMaterial('MAT_CHARCOAL', { roughness: 0.45 }),
  )
  handset.position.set(0.5, 0.81, -0.15)
  g.add(handset)

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
): THREE.Group | null {
  if (isWorldBatching()) {
    queueChair(x, z, rotationY)
    return null
  }
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = rotationY

  const pack = cloneOfficeAsset('office_chair', { target: [0.58, 1.05, 0.58] })
  if (pack) {
    g.add(pack)
  } else {
    const mesh = new THREE.Mesh(buildChairGeometry(), getMaterial('MAT_CHAIR', { roughness: 0.75 }))
    mesh.castShadow = true
    g.add(mesh)
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
    metalMaterial(),
  )
  body.position.y = 0.75
  body.castShadow = true
  g.add(body)

  for (let i = 0; i < 4; i++) {
    const drawer = new THREE.Mesh(
      new RoundedBoxGeometry(0.82, 0.32, 0.02, 1, 0.005),
      metalMaterial(),
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

  const pack = cloneOfficeAsset('printer_big', { target: [1.15, 1.08, 1.0] })
  if (pack) {
    g.add(pack)
  } else {
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(1.15, 0.85, 0.85, 4, 0.045),
      plasticMaterial(),
    )
    body.position.y = 0.5
    body.castShadow = true
    g.add(body)

    const lid = new THREE.Mesh(
      new RoundedBoxGeometry(1.05, 0.08, 0.7, 3, 0.02),
      plasticMaterial(),
    )
    lid.position.set(0, 0.98, -0.05)
    g.add(lid)

    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.04, 0.15),
      getMaterial('MAT_CHARCOAL', { roughness: 0.7 }),
    )
    slot.position.set(0, 0.92, 0.35)
    g.add(slot)

    const tray = new THREE.Mesh(
      new RoundedBoxGeometry(0.75, 0.04, 0.4, 2, 0.01),
      getMaterial('MAT_PAPER', { roughness: 0.7 }),
    )
    tray.position.set(0, 0.35, 0.5)
    g.add(tray)

    const panel = new THREE.Mesh(
      new RoundedBoxGeometry(0.4, 0.2, 0.05, 2, 0.01),
      getMaterial('MAT_CHARCOAL', {
        roughness: 0.35,
        emissive: 0x2a4038,
        emissiveIntensity: 0.45,
      }),
    )
    panel.position.set(0.3, 0.95, 0.35)
    panel.rotation.x = -0.35
    g.add(panel)

    for (let i = 0; i < 6; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.08, 0.35),
        getMaterial('MAT_CHARCOAL', { roughness: 0.8 }),
      )
      vent.position.set(0.55, 0.35 + i * 0.1, 0)
      g.add(vent)
    }
  }

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

  const packDesk = cloneOfficeAsset('desk_big', { yaw: Math.PI / 2, target: [1.05, 0.74, 0.55] })
  if (packDesk) {
    g.add(packDesk)
    const topY = deskSurfaceY(packDesk)
    placePackProp(g, 'monitor', 0, topY, -0.06, [0.48, 0.4, 0.16], Math.PI / 2)
    placePackProp(g, 'keyboard', 0, topY, 0.12, [0.4, 0.025, 0.14], Math.PI / 2)
    placePackProp(g, 'mug', 0.35, topY, 0.1, [0.07, 0.08, 0.07], 0.3)
  } else {
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
  }

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
    deskMaterial(4, 1.2),
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

  placePackProp(g, 'mug', 0.12, 0.75, 0.08, [0.08, 0.09, 0.08], 0.4)
  placePackProp(g, 'mug', -0.15, 0.75, -0.05, [0.08, 0.09, 0.08], -0.6)

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

  placePackProp(g, 'mug', 0.35, 0.92, 0.1, [0.08, 0.09, 0.08], 0.2)
  placePackProp(g, 'mug', 0.55, 0.92, -0.05, [0.08, 0.09, 0.08], -0.5)
  placePackProp(g, 'pencil_holder', 0.85, 0.92, 0.05, [0.09, 0.1, 0.09], 0.1)

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

  // Faceless corporate silhouette — suit torso + head orb, no face
  const legs = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.12, height * 0.35, 3, 8),
    getMaterial('MAT_CHARCOAL', { roughness: 0.75 }),
  )
  legs.position.y = height * 0.28
  legs.castShadow = true
  g.add(legs)

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.2, height * 0.28, 4, 8),
    getMaterial(colorKey, { roughness: 0.7 }),
  )
  torso.position.y = height * 0.58
  torso.castShadow = true
  g.add(torso)

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 10, 8),
    getMaterial('MAT_NPC', { roughness: 0.65 }),
  )
  head.position.y = height - 0.1
  g.add(head)

  // Tie accent
  if (colorKey === 'MAT_MANAGER') {
    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.22, 0.02),
      getMaterial('MAT_GOLD', { roughness: 0.5 }),
    )
    tie.position.set(0, height * 0.62, 0.18)
    g.add(tie)
  } else {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.05, 0.01),
      getMaterial('MAT_STEEL', { roughness: 0.4, metalness: 0.4 }),
    )
    badge.position.set(0.12, height * 0.68, 0.18)
    g.add(badge)
  }

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

  const corner = cloneOfficeAsset('desk_corner', { target: [2.35, 0.76, 1.55] })
  if (corner) {
    g.add(corner)
    const topY = deskSurfaceY(corner)
    placePackProp(g, 'monitor_ultrawide', 0.15, topY, -0.15, [0.85, 0.45, 0.2], Math.PI / 2)
    placePackProp(g, 'lamp_architect', -0.75, topY, -0.25, [0.3, 0.52, 0.34], -0.5)
    placePackProp(g, 'keyboard', 0.1, topY, 0.25, [0.5, 0.03, 0.17], Math.PI / 2)
    placePackProp(g, 'wireless_mouse', 0.48, topY, 0.28, [0.07, 0.035, 0.11], Math.PI / 2)
    placePackProp(g, 'mug', -0.55, topY, 0.3, [0.08, 0.09, 0.08], 0.4)
    placePackProp(g, 'pencil_holder', 0.85, topY, -0.2, [0.1, 0.11, 0.1], -0.2)
  } else {
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
  }

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
