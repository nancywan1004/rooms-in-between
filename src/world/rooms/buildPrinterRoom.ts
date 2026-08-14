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
  createHandbook,
  createPaperStack,
  createPlant,
  createPrinter,
  createTerminal,
} from '../furniture'
import {
  createPaperRack,
  createTrashBin,
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
const { cx, cz, w, d, h } = ROOM.printer
const x0 = cx - w / 2
const x1 = cx + w / 2
const z0 = cz - d / 2
const z1 = cz + d / 2

export function buildPrinterRoom(
  rooms: THREE.Object3D,
  architecture: THREE.Object3D,
  props: THREE.Object3D,
  colliders: ColliderWorld,
  doors: DoorRegistry,
  triggers: TriggerRegistry,
): void {
  const root = new THREE.Group()
  root.name = 'PrinterRoom'
  rooms.add(root)

  createFloor(architecture, colliders, cx, cz, w, d, 'MAT_FLOOR')
  createCeiling(architecture, cx, cz, w, d, h)

  createWall(architecture, colliders, cx, z0, w, h, T, 0, 'MAT_WALL')
  createWall(architecture, colliders, cx, z1, w, h, T, 0, 'MAT_WALL')
  createWall(architecture, colliders, x0, cz, d, h, T, Math.PI / 2, 'MAT_WALL')
  createWallWithDoorway(architecture, colliders, x1, cz, d, h, T, Math.PI / 2, DW, DH, 'MAT_ACCENT_PRINTER')

  createFloor(architecture, colliders, -7.25, 0, 0.5, 2.0, 'MAT_DUSTY_BLUE')

  const hide = new THREE.Mesh(
    new RoundedBoxGeometry(0.9, 2.0, 0.5, 2, 0.02),
    getMaterial('MAT_STEEL', { roughness: 0.5, metalness: 0.25 }),
  )
  hide.position.set(x0 + 0.6, 1.0, z0 + 0.9)
  hide.castShadow = true
  props.add(hide)
  colliders.addAabb('hide_printer', 'furniture', x0 + 0.6, 1.0, z0 + 0.9, 0.95, 2.0, 0.55)

  createPrinter(props, colliders, cx - 0.8, cz - 1.2)
  createTerminal(props, colliders, cx + 1.2, cz - 1.5, Math.PI)
  createPaperRack(props, colliders, cx - 1.8, cz + 2.0, Math.PI / 2)
  createPaperStack(props, cx - 0.3, cz - 0.4)
  createPaperStack(props, cx - 0.3, cz - 0.05)
  createHandbook(props, cx + 1.2, 0.78, cz - 1.5)
  createPlant(props, cx + 1.8, cz + 2.2, false)
  createTrashBin(props, cx + 2.0, cz - 2.4)

  createWallSlogan(architecture, ['PRINT.', 'FILE.', 'FORGET.'], x0 + 0.12, 2.15, cz + 1.2, Math.PI / 2, 2.4, 0.65)
  createWallFrame(architecture, cx + 0.5, 1.9, z0 + 0.12, 0, 0.55, 0.4)
  createWallClock(architecture, cx - 0.2, 2.35, z1 - 0.12, Math.PI)

  createCeilingLight(architecture, cx, h, cz, 0xd0dde8, 1.1)
  createCeilingLight(architecture, cx - 1.5, h, cz + 1.5, 0xd0dde8, 0.6)

  doors.register({
    id: 'door_printer',
    state: 'closed',
    x: x1,
    y: 0,
    z: 0,
    width: DW,
    height: DH,
    rotationY: -Math.PI / 2,
    accent: 'printer',
  })

  triggers.addBox('trigger_rule1_start', cx, 1, cz, w - 1, 2.5, d - 1)
  triggers.addBox('trigger_rule1_complete', cx + 1.2, 1, cz - 1.5, 1.5, 2.5, 1.5)
}
