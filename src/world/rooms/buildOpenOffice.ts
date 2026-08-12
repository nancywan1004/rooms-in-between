import * as THREE from 'three'
import {
  createCeiling,
  createCeilingLight,
  createCubiclePartition,
  createFloor,
  createGlassWall,
  createWallSlogan,
  createWallWithDoorway,
} from '../architecture'
import {
  createCabinet,
  createChair,
  createComplianceNotice,
  createDesk,
  createPlant,
} from '../furniture'
import { ROOM, officeLayout } from '../layout'
import type { ColliderWorld } from '../colliders'
import type { DoorRegistry } from '../doors'
import type { TriggerRegistry } from '../triggers'
import { getMaterial } from '../../theme/materials'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const T = ROOM.wallT
const DW = ROOM.doorW
const DH = ROOM.doorH
const { x0, x1, z0, z1, h } = ROOM.open
const W = x1 - x0
const D = z1 - z0
const CX = (x0 + x1) / 2
const CZ = (z0 + z1) / 2

export function buildOpenOffice(
  rooms: THREE.Object3D,
  architecture: THREE.Object3D,
  props: THREE.Object3D,
  colliders: ColliderWorld,
  doors: DoorRegistry,
  triggers: TriggerRegistry,
): void {
  const root = new THREE.Group()
  root.name = 'OpenOffice'
  rooms.add(root)

  createFloor(architecture, colliders, CX, CZ, W, D)
  createCeiling(architecture, CX, CZ, W, D, h)

  createWallWithDoorway(architecture, colliders, 0, z0, W, h, T, 0, DW, DH)
  createWallWithDoorway(architecture, colliders, 0, z1, W, h, T, 0, DW, DH)
  createWallWithDoorway(architecture, colliders, x0, 0, D, h, T, Math.PI / 2, DW, DH)
  createWallWithDoorway(architecture, colliders, x1, 0, D, h, T, Math.PI / 2, DW, DH)

  buildElevatorAlcove(architecture, colliders, doors)

  createGlassWall(architecture, colliders, -2.2, -4.2, 2.4, 2.4, 0.06, Math.PI / 2)

  // Corporate slogans (style.png)
  createWallSlogan(architecture, ['WORK. OBEY.', 'COMPLY. EXCEL.'], 0, 2.35, z0 + 0.12, 0, 4.5, 1.0)
  createWallSlogan(
    architecture,
    ['TEAMWORK IS EXPECTED.', 'SILENCE IS APPRECIATED.'],
    x1 - 0.12,
    2.2,
    -2.5,
    -Math.PI / 2,
    3.6,
    0.85,
  )
  createWallSlogan(
    architecture,
    ['DO YOUR JOB.', '— MANAGEMENT'],
    x0 + 0.12,
    2.25,
    2.8,
    Math.PI / 2,
    3.2,
    0.8,
  )

  // Cubicle partitions between desk islands (sightline + liminal office)
  createCubiclePartition(props, colliders, -4.2, -2.5, 2.6, 0, 1.2)
  createCubiclePartition(props, colliders, 4.2, -2.5, 2.6, 0, 1.2)
  createCubiclePartition(props, colliders, -4.2, 2.5, 2.6, 0, 1.2)
  createCubiclePartition(props, colliders, 4.2, 2.8, 2.2, 0, 1.2)

  // Desk islands — a few with feminine accents (tragic personalization)
  officeLayout.desks.forEach((desk, i) => {
    const accents = i === 2 || i === 7 || i === 11
    createDesk(props, colliders, desk.x, desk.z, desk.rotation, true, accents)
    const chairOffset = 0.65
    const ox = Math.sin(desk.rotation) * chairOffset
    const oz = Math.cos(desk.rotation) * chairOffset
    createChair(props, desk.x + ox, desk.z + oz, desk.rotation + Math.PI)
  })

  createCabinet(props, colliders, -6.2, -4.8, Math.PI / 2)
  createCabinet(props, colliders, 6.2, -4.8, -Math.PI / 2)
  createCabinet(props, colliders, -6.2, 4.5, Math.PI / 2)

  createPlant(props, -1.5, -0.8, true)
  createPlant(props, 1.8, 0.6, false)

  createComplianceNotice(props, -5.2, 4.5, Math.PI)

  // Fluorescent grid
  for (const [lx, lz] of [
    [-4, -3.5],
    [0, -3.5],
    [4, -3.5],
    [-4, 0],
    [0, 0],
    [4, 0],
    [-4, 3.5],
    [4, 3.5],
  ] as const) {
    createCeilingLight(architecture, lx, h, lz, 0xe8eef2, 1.35)
  }

  // Subtle room-entry tint
  createCeilingLight(architecture, -6.3, h, 0, 0xc8d4e0, 0.7)
  createCeilingLight(architecture, 6.3, h, 0, 0xd0dcc8, 0.7)
  createCeilingLight(architecture, 0, h, -5.4, 0xe0d4c0, 0.55)
  createCeilingLight(architecture, 0, h, 5.4, 0xe0c8c0, 0.55)

  triggers.addBox('trigger_spawn', -3.5, 1, 5, 2.5, 2.5, 2.5)
  triggers.addBox('trigger_manager_spawn_01', 0, 1, -5, 2, 2.5, 1.5)
  triggers.addBox('trigger_manager_spawn_02', 0, 1, 0, 2, 2.5, 2)
}

function buildElevatorAlcove(
  architecture: THREE.Object3D,
  colliders: ColliderWorld,
  doors: DoorRegistry,
): void {
  const ex = -3.5
  const ez = z1 - 0.15
  const ew = 2.5
  const eh = 3.0

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(ew + 0.2, eh, 0.18, 2, 0.02),
    getMaterial('MAT_STEEL', { roughness: 0.4, metalness: 0.35 }),
  )
  frame.position.set(ex, eh / 2, ez)
  architecture.add(frame)

  colliders.addAabb('elev_L', 'wall', ex - ew / 2, eh / 2, ez, 0.2, eh, 0.35)
  colliders.addAabb('elev_R', 'wall', ex + ew / 2, eh / 2, ez, 0.2, eh, 0.35)

  doors.register({
    id: 'door_elevator',
    state: 'locked',
    x: ex,
    y: 0,
    z: ez,
    width: ew - 0.3,
    height: DH,
    rotationY: Math.PI,
    accent: 'elevator',
  })
}
