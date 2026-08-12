import * as THREE from 'three'
import {
  createCeiling,
  createCeilingLight,
  createFloor,
  createGlassWall,
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

  // North wall (toward Manager) — doorway at center
  createWallWithDoorway(architecture, colliders, 0, z0, W, h, T, 0, DW, DH)
  // South wall (toward Meeting) — doorway at x=0; elevator alcove later
  createWallWithDoorway(architecture, colliders, 0, z1, W, h, T, 0, DW, DH)
  // West wall (Printer)
  createWallWithDoorway(architecture, colliders, x0, 0, D, h, T, Math.PI / 2, DW, DH)
  // East wall (Break)
  createWallWithDoorway(architecture, colliders, x1, 0, D, h, T, Math.PI / 2, DW, DH)

  // Elevator facade on south-west — spawn in front at (-3.5, 5)
  buildElevatorAlcove(architecture, colliders, doors)

  // Glass partition near NW (sightline break)
  createGlassWall(architecture, colliders, -2.2, -4.2, 2.4, 2.4, 0.06, Math.PI / 2)

  // Desk islands
  for (const desk of officeLayout.desks) {
    createDesk(props, colliders, desk.x, desk.z, desk.rotation)
    const chairOffset = 0.65
    const ox = Math.sin(desk.rotation) * chairOffset
    const oz = Math.cos(desk.rotation) * chairOffset
    createChair(props, desk.x + ox, desk.z + oz, desk.rotation + Math.PI)
  }

  // Cabinets
  createCabinet(props, colliders, -6.2, -4.8, Math.PI / 2)
  createCabinet(props, colliders, 6.2, -4.8, -Math.PI / 2)

  // Plants
  createPlant(props, -1.5, -0.8, true)
  createPlant(props, 1.8, 0.6, false)

  // Compliance notice near elevator
  createComplianceNotice(props, -5.2, 4.5, Math.PI)

  // Overhead lights
  for (const [lx, lz] of [
    [-3.5, -3],
    [3.5, -3],
    [-3.5, 3],
    [3.5, 3],
    [0, 0],
  ] as const) {
    createCeilingLight(architecture, lx, h, lz, 0xfff5ea, 0.9)
  }

  // Accent entry lights
  createCeilingLight(architecture, -6.5, h, 0, 0xa0b4c8, 0.55) // printer
  createCeilingLight(architecture, 6.5, h, 0, 0xa8c098, 0.55) // break
  createCeilingLight(architecture, 0, h, -5.5, 0xc4a574, 0.45) // manager
  createCeilingLight(architecture, 0, h, 5.5, 0xd4a08a, 0.45) // meeting

  triggers.addBox('trigger_spawn', -3.5, 1, 5, 2.5, 2.5, 2.5)
  triggers.addBox('trigger_manager_spawn_01', 0, 1, -5, 2, 2.5, 1.5)
  triggers.addBox('trigger_manager_spawn_02', 0, 1, 0, 2, 2.5, 2)
}

function buildElevatorAlcove(
  architecture: THREE.Object3D,
  colliders: ColliderWorld,
  doors: DoorRegistry,
): void {
  // Interior elevator facade on south wall — spawn in front at (-3.5, 5)
  const ex = -3.5
  const ez = z1 - 0.15
  const ew = 2.5
  const eh = 3.0

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(ew + 0.2, eh, 0.18, 2, 0.02),
    getMaterial('MAT_CHARCOAL', { roughness: 0.55 }),
  )
  frame.position.set(ex, eh / 2, ez)
  architecture.add(frame)

  // Side jambs as colliders so player doesn't walk into frame
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
