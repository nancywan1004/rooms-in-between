import * as THREE from 'three'
import {
  createCeiling,
  createCeilingLight,
  createFloor,
  createWall,
  createWallSlogan,
  createWallWithDoorway,
} from '../architecture'
import {
  createBreakTable,
  createCoffeeCounter,
  createCup,
  createNpc,
  createSofa,
  createSuggestionBox,
  createWaterCooler,
} from '../furniture'
import {
  createFloorPlanter,
  createHighWindow,
  createPersonalizedMug,
  createTrashBin,
  createVendingMachine,
  createWallClock,
  createWallFrame,
} from '../dressing'
import { ROOM } from '../layout'
import type { ColliderWorld } from '../colliders'
import type { DoorRegistry } from '../doors'
import type { TriggerRegistry } from '../triggers'

const T = ROOM.wallT
const DW = ROOM.doorW
const DH = ROOM.doorH
const { cx, cz, w, d, h } = ROOM.break
const x0 = cx - w / 2
const x1 = cx + w / 2
const z0 = cz - d / 2
const z1 = cz + d / 2

export function buildBreakRoom(
  rooms: THREE.Object3D,
  architecture: THREE.Object3D,
  props: THREE.Object3D,
  characters: THREE.Object3D,
  colliders: ColliderWorld,
  doors: DoorRegistry,
  triggers: TriggerRegistry,
): void {
  const root = new THREE.Group()
  root.name = 'BreakRoom'
  rooms.add(root)

  createFloor(architecture, colliders, cx, cz, w, d, 'MAT_FLOOR')
  createCeiling(architecture, cx, cz, w, d, h)

  createWall(architecture, colliders, cx, z0, w, h, T, 0, 'MAT_WALL')
  createWall(architecture, colliders, cx, z1, w, h, T, 0, 'MAT_WALL')
  createWall(architecture, colliders, x1, cz, d, h, T, Math.PI / 2, 'MAT_WALL')
  createWallWithDoorway(architecture, colliders, x0, cz, d, h, T, Math.PI / 2, DW, DH, 'MAT_ACCENT_BREAK')

  createFloor(architecture, colliders, 7.25, 0, 0.5, 1.8, 'MAT_SAGE')

  createCoffeeCounter(props, colliders, cx + 1.5, z0 + 1.2, 0)
  createWaterCooler(props, colliders, cx + 2.2, cz + 1.5)
  createVendingMachine(props, colliders, cx + 2.0, z1 - 1.3, Math.PI)
  createBreakTable(props, colliders, cx - 1.0, cz - 1.2)
  createBreakTable(props, colliders, cx - 1.2, cz + 1.5)
  createSofa(props, colliders, cx + 0.5, z1 - 1.0, Math.PI)
  createSuggestionBox(props, cx - 2.2, cz - 2.4)
  createCup(props, cx - 1.0, 0.78, cz - 1.2)
  createPersonalizedMug(props, cx - 1.15, 0.78, cz + 1.5, 'MAT_BLUSH')
  createPersonalizedMug(props, cx + 1.4, 0.95, z0 + 1.2, 'MAT_SAGE')
  createTrashBin(props, cx - 2.4, cz + 2.5)
  createFloorPlanter(props, cx - 2.3, cz - 0.2)

  createWallSlogan(architecture, ['TAKE A BREAK.', 'THEN RETURN.'], x1 - 0.12, 2.2, cz, -Math.PI / 2, 2.8, 0.7)
  createWallFrame(architecture, cx - 0.5, 2.0, z0 + 0.12, 0, 0.65, 0.45)
  createWallClock(architecture, cx + 0.8, 2.4, z0 + 0.12, 0)
  createHighWindow(architecture, cx - 1.5, 2.55, z1 - 0.12, Math.PI, 1.4, 0.45)

  createNpc(characters, cx - 0.5, cz - 0.3)
  createNpc(characters, cx - 1.8, cz + 1.2)
  createNpc(characters, cx + 0.8, cz + 0.8)

  createCeilingLight(architecture, cx, h, cz, 0xe0e8e0, 1.0)
  createCeilingLight(architecture, cx - 1.2, h, cz + 1.5, 0xe0e8e0, 0.55)

  doors.register({
    id: 'door_break',
    state: 'closed',
    x: x0,
    y: 0,
    z: 0,
    width: DW,
    height: DH,
    rotationY: Math.PI / 2,
    accent: 'break',
  })

  triggers.addBox('trigger_rule2_start', cx, 1, cz, w - 1, 2.5, d - 1)
  triggers.addBox('trigger_rule2_complete', cx - 2.2, 1, cz - 2.4, 1.2, 2.5, 1.2)
}
