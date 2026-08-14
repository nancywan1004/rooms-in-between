import * as THREE from 'three'
import {
  createCeiling,
  createCeilingLight,
  createFloor,
  createWall,
  createWallWithDoorway,
} from '../architecture'
import {
  createEvidenceCard,
  createManagerDesk,
  createPlant,
  createProposal,
} from '../furniture'
import {
  createHighWindow,
  createLavenderVase,
  createWallClock,
  createWallFrame,
} from '../dressing'
import { ROOM } from '../layout'
import type { ColliderWorld } from '../colliders'
import type { DoorRegistry } from '../doors'
import type { TriggerRegistry } from '../triggers'
import { getMaterial } from '../../theme/materials'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const T = ROOM.wallT
const DW = ROOM.doorW
const DH = ROOM.doorH
const { cx, cz, w, d, h } = ROOM.manager
const x0 = cx - w / 2
const x1 = cx + w / 2
const z0 = cz - d / 2
const z1 = cz + d / 2

export function buildManagerOffice(
  rooms: THREE.Object3D,
  architecture: THREE.Object3D,
  props: THREE.Object3D,
  colliders: ColliderWorld,
  doors: DoorRegistry,
  triggers: TriggerRegistry,
): void {
  const root = new THREE.Group()
  root.name = 'ManagerOffice'
  rooms.add(root)

  createFloor(architecture, colliders, cx, cz, w, d, 'MAT_FLOOR')
  createCeiling(architecture, cx, cz, w, d, h)

  // North (far) wall — solid, oppressive
  createWall(architecture, colliders, cx, z0, w, h, T, 0, 'MAT_ACCENT_MANAGER')
  // South doorway to Open Office
  createWallWithDoorway(architecture, colliders, cx, z1, w, h, T, 0, DW, DH, 'MAT_GOLD')
  createWall(architecture, colliders, x0, cz, d, h, T, Math.PI / 2, 'MAT_WALL')
  createWall(architecture, colliders, x1, cz, d, h, T, Math.PI / 2, 'MAT_WALL')

  // Corridor to open office
  createFloor(architecture, colliders, 0, -6.5, 2.0, 1.0, 'MAT_GOLD')

  // Symmetric display walls
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(
      new RoundedBoxGeometry(0.08, 2.2, 2.4, 2, 0.02),
      getMaterial('MAT_CHARCOAL', { roughness: 0.6 }),
    )
    panel.position.set(side * 3.2, 1.4, cz - 0.5)
    props.add(panel)

    const gold = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 2.2),
      getMaterial('MAT_GOLD', { roughness: 0.35, metalness: 0.35 }),
    )
    gold.position.set(side * 3.2, 2.4, cz - 0.5)
    props.add(gold)
  }

  // Desk at far (north) end
  createManagerDesk(props, colliders, 0, z0 + 1.6)
  createProposal(props, 0, 0.82, z0 + 1.6)

  // 3 evidence cards dispersed
  createEvidenceCard(props, -2.5, 0.02, cz + 0.5)
  createEvidenceCard(props, 2.8, 0.02, cz - 1.2)
  createEvidenceCard(props, -1.2, 0.82, z0 + 1.4)

  createPlant(props, -3.0, z0 + 1.2, true)
  createPlant(props, 3.0, z0 + 1.2, true)
  createLavenderVase(props, -1.5, 0.82, z0 + 1.5)
  createWallFrame(props, -3.15, 1.8, cz + 1.2, Math.PI / 2, 0.7, 0.5)
  createWallFrame(props, 3.15, 1.8, cz + 1.2, -Math.PI / 2, 0.7, 0.5)
  createWallClock(architecture, 0, 3.2, z0 + 0.12, 0)
  createHighWindow(architecture, -2.5, 3.3, z0 + 0.12, 0, 1.4, 0.45)
  createHighWindow(architecture, 2.5, 3.3, z0 + 0.12, 0, 1.4, 0.45)

  // Darker / fewer lights
  createCeilingLight(architecture, 0, h, cz, 0xd0d4d8, 0.4)
  createCeilingLight(architecture, 0, h, z0 + 1.5, 0xe0d4b8, 0.55)

  doors.register({
    id: 'door_manager',
    state: 'closed',
    x: 0,
    y: 0,
    z: z1,
    width: DW,
    height: DH,
    rotationY: 0,
    accent: 'manager',
  })

  triggers.addBox('trigger_rule3_start', cx, 1, cz, w - 1.5, 2.5, d - 1.5)
}
