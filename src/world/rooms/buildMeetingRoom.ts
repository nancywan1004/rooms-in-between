import * as THREE from 'three'
import {
  createCeiling,
  createCeilingLight,
  createFloor,
  createWall,
  createWallWithDoorway,
} from '../architecture'
import {
  createCup,
  createMeetingTable,
  createNpc,
  createChair,
} from '../furniture'
import { ROOM } from '../layout'
import type { ColliderWorld } from '../colliders'
import type { DoorRegistry } from '../doors'
import type { TriggerRegistry } from '../triggers'
import { getMaterial } from '../../theme/materials'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const T = ROOM.wallT
const DW = ROOM.doorW
const DH = ROOM.doorH
const { cx, cz, w, d, h } = ROOM.meeting
const x0 = cx - w / 2
const x1 = cx + w / 2
const z0 = cz - d / 2
const z1 = cz + d / 2

export function buildMeetingRoom(
  rooms: THREE.Object3D,
  architecture: THREE.Object3D,
  props: THREE.Object3D,
  characters: THREE.Object3D,
  colliders: ColliderWorld,
  doors: DoorRegistry,
  triggers: TriggerRegistry,
): void {
  const root = new THREE.Group()
  root.name = 'MeetingRoom'
  rooms.add(root)

  createFloor(architecture, colliders, cx, cz, w, d, 'MAT_FLOOR')
  createCeiling(architecture, cx, cz, w, d, h)

  // North doorway to Open Office
  createWallWithDoorway(architecture, colliders, cx, z0, w, h, T, 0, DW, DH, 'MAT_ACCENT_MEETING')
  createWall(architecture, colliders, cx, z1, w, h, T, 0, 'MAT_WALL')
  createWall(architecture, colliders, x0, cz, d, h, T, Math.PI / 2, 'MAT_WALL')
  createWall(architecture, colliders, x1, cz, d, h, T, Math.PI / 2, 'MAT_WALL')

  createFloor(architecture, colliders, 0, 6.25, 2.0, 0.5, 'MAT_CORAL')

  createMeetingTable(props, colliders, 0, cz)

  // Chairs / faceless NPCs around table
  const seats = [
    { x: -1.5, z: cz - 1.1, r: 0 },
    { x: 0, z: cz - 1.1, r: 0 },
    { x: 1.5, z: cz - 1.1, r: 0 },
    { x: -1.5, z: cz + 1.1, r: Math.PI },
    { x: 0, z: cz + 1.1, r: Math.PI },
    { x: 1.5, z: cz + 1.1, r: Math.PI },
    { x: -2.6, z: cz, r: Math.PI / 2 },
    { x: 2.6, z: cz, r: -Math.PI / 2 },
  ]
  for (const s of seats) {
    createChair(props, s.x, s.z, s.r)
    createNpc(characters, s.x, s.z + (s.r === 0 ? -0.15 : s.r === Math.PI ? 0.15 : 0))
  }

  // Voice door / hidden button placeholders
  const voiceDoor = new THREE.Mesh(
    new RoundedBoxGeometry(1.0, 2.2, 0.12, 2, 0.02),
    getMaterial('MAT_CORAL', { roughness: 0.5 }),
  )
  voiceDoor.position.set(x1 - 0.3, 1.1, cz + 2.5)
  props.add(voiceDoor)

  const hiddenBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.05),
    getMaterial('MAT_GOLD', { roughness: 0.4, emissive: 0xc4a574, emissiveIntensity: 0.3 }),
  )
  hiddenBtn.position.set(x0 + 0.15, 1.0, cz - 2.8)
  props.add(hiddenBtn)

  createCup(props, 0.4, 0.82, cz)

  // Cool lighting (boss pre-state)
  createCeilingLight(architecture, -2, h, cz, 0xc8d4e0, 0.7)
  createCeilingLight(architecture, 2, h, cz, 0xc8d4e0, 0.7)
  createCeilingLight(architecture, 0, h, cz + 2, 0xb0c0d0, 0.5)

  doors.register({
    id: 'door_meeting',
    state: 'closed',
    x: 0,
    y: 0,
    z: z0,
    width: DW,
    height: DH,
    rotationY: Math.PI,
    accent: 'meeting',
  })

  triggers.addBox('trigger_boss_start', 0, 1, cz, 3, 2.5, 2)
  triggers.addBox('trigger_boss_phase_02', -2, 1, cz + 2, 2, 2.5, 2)
  triggers.addBox('trigger_boss_phase_03', 2, 1, cz - 2, 2, 2.5, 2)
  triggers.addBox('trigger_ending', 0, 1, z1 - 1.5, 3, 2.5, 2)
}
