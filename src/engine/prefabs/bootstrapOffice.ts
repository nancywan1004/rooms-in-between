import { Scene } from '../Scene'
import { SceneGameObject } from '../SceneGameObject'
import { CollisionComponent } from '../components/CollisionComponent'
import { ScriptComponent } from '../components/ScriptComponent'
import { officeLayout, ROOM } from '../../world/layout'
import type { PaletteKey } from '../../theme/palette'
import type { DoorAccent } from '../components/DoorComponent'
import type { DoorState } from '../../world/doors'
import {
  createDoorObject,
  createEmptyObject,
  createFactoryObject,
  createFillLight,
  createPrimitiveBox,
  createSpawnPoint,
  createTriggerObject,
} from './factories'
import type { ColliderBox } from '../../world/colliders'
import type { Vec3Tuple } from '../ids'

const T = ROOM.wallT
const DW = ROOM.doorW
const DH = ROOM.doorH

function place(parent: SceneGameObject, child: SceneGameObject, x: number, y: number, z: number, rotY = 0): void {
  child.transform.setPosition(x, y, z)
  child.transform.setEuler(0, rotY, 0)
  parent.addChild(child)
}

function factory(
  parent: SceneGameObject,
  name: string,
  factoryId: string,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  args: Record<string, unknown> = {},
  collision?: { kind: ColliderBox['kind']; size: Vec3Tuple; offset?: Vec3Tuple },
  tags: string[] = ['furniture'],
): SceneGameObject {
  const go = createFactoryObject(name, factoryId, args, collision, tags)
  place(parent, go, x, y, z, rotY)
  return go
}

function addWall(
  parent: SceneGameObject,
  name: string,
  x: number,
  z: number,
  length: number,
  height: number,
  thickness: number,
  rotY: number,
  matKey: PaletteKey = 'MAT_WALL',
): SceneGameObject {
  return factory(
    parent,
    name,
    'wall',
    x,
    0,
    z,
    rotY,
    { length, height, thickness, matKey },
    { kind: 'wall', size: [length, height, thickness], offset: [0, height / 2, 0] },
    ['architecture'],
  )
}

function addDoorwayWall(
  parent: SceneGameObject,
  name: string,
  cx: number,
  cz: number,
  totalLength: number,
  height: number,
  thickness: number,
  rotY: number,
  matKey: PaletteKey = 'MAT_WALL',
): void {
  const side = (totalLength - DW) / 2
  if (side < 0.05) return
  const alongX = Math.cos(rotY)
  const alongZ = -Math.sin(rotY)
  addWall(parent, `${name}_L`, cx + alongX * -(DW / 2 + side / 2), cz + alongZ * -(DW / 2 + side / 2), side, height, thickness, rotY, matKey)
  addWall(parent, `${name}_R`, cx + alongX * (DW / 2 + side / 2), cz + alongZ * (DW / 2 + side / 2), side, height, thickness, rotY, matKey)
  if (height > DH + 0.05) {
    const lintelH = height - DH
    factory(
      parent,
      `${name}_lintel`,
      'wall',
      cx,
      DH,
      cz,
      rotY,
      { length: DW, height: lintelH, thickness, matKey },
      { kind: 'wall', size: [DW, lintelH, thickness], offset: [0, lintelH / 2, 0] },
      ['architecture'],
    )
  }
}

function addDoor(
  parent: SceneGameObject,
  doorId: string,
  x: number,
  z: number,
  rotY: number,
  accent: DoorAccent,
  state: DoorState = 'closed',
): void {
  const door = createDoorObject({ doorId, width: DW, height: DH, accent, state })
  place(parent, door, x, 0, z, rotY)
}

function addTrigger(parent: SceneGameObject, id: string, x: number, y: number, z: number, sx: number, sy: number, sz: number): void {
  const tr = createTriggerObject(id, [sx, sy, sz])
  place(parent, tr, x, y, z, 0)
}

function addFloor(parent: SceneGameObject, name: string, w: number, d: number, x = 0, z = 0, matKey: PaletteKey = 'MAT_FLOOR'): void {
  factory(parent, name, 'floor', x, 0, z, 0, { w, d, matKey }, undefined, ['architecture'])
}

function addCeiling(parent: SceneGameObject, w: number, d: number, h: number): void {
  factory(parent, 'Ceiling', 'ceiling', 0, 0, 0, 0, { w, d, y: h }, undefined, ['architecture'])
}

export function bootstrapOfficeScene(scene: Scene): void {
  scene.clear()
  scene.name = 'Office MVP'

  const office = createEmptyObject('Office')
  office.tags = ['office']
  scene.add(office)

  buildOpenOffice(office)
  buildPrinterRoom(office)
  buildBreakRoom(office)
  buildManagerOffice(office)
  buildMeetingRoom(office)
  buildShared(office)
}

function buildOpenOffice(office: SceneGameObject): void {
  const { x0, x1, z0, z1, h } = ROOM.open
  const W = x1 - x0
  const D = z1 - z0
  const room = createEmptyObject('OpenOffice')
  room.tags = ['Room']
  place(office, room, 0, 0, 0)

  addFloor(room, 'Floor', W, D)
  addCeiling(room, W, D, h)
  addDoorwayWall(room, 'Wall_N', 0, z0, W, h, T, 0)
  addDoorwayWall(room, 'Wall_S', 0, z1, W, h, T, 0)
  addDoorwayWall(room, 'Wall_W', x0, 0, D, h, T, Math.PI / 2)
  addDoorwayWall(room, 'Wall_E', x1, 0, D, h, T, Math.PI / 2)

  const elev = createEmptyObject('ElevatorAlcove')
  place(room, elev, 0, 0, 0)
  const frame = createPrimitiveBox(2.7, 3, 0.18)
  frame.name = 'ElevatorFrame'
  const frameCol = frame.getComponent(CollisionComponent)
  if (frameCol) {
    frameCol.kind = 'wall'
    frameCol.size = [2.7, 3, 0.18]
  }
  place(elev, frame, -3.5, 1.5, z1 - 0.15)
  addDoor(elev, 'door_elevator', -3.5, z1 - 0.15, Math.PI, 'elevator', 'locked')

  factory(room, 'GlassWall', 'glassWall', -2.2, 0, -4.2, Math.PI / 2, { length: 2.4, height: 2.4, thickness: 0.06 }, {
    kind: 'wall',
    size: [2.4, 2.4, 0.06],
    offset: [0, 1.2, 0],
  }, ['architecture'])

  factory(room, 'Slogan_S', 'wallSlogan', 0, 2.35, z0 + 0.12, 0, { lines: ['WORK. OBEY.', 'COMPLY. EXCEL.'], width: 4.5, height: 1 }, undefined, ['architecture'])
  factory(room, 'Slogan_E', 'wallSlogan', x1 - 0.12, 2.2, -2.5, -Math.PI / 2, { lines: ['TEAMWORK IS EXPECTED.', 'SILENCE IS APPRECIATED.'], width: 3.6, height: 0.85 }, undefined, ['architecture'])
  factory(room, 'Slogan_W', 'wallSlogan', x0 + 0.12, 2.25, 2.8, Math.PI / 2, { lines: ['DO YOUR JOB.', '— MANAGEMENT'], width: 3.2, height: 0.8 }, undefined, ['architecture'])

  factory(room, 'Partition_NW', 'cubiclePartition', -4.2, 0, -2.5, 0, { length: 2.6, height: 1.2 }, { kind: 'furniture', size: [2.6, 1.2, 0.1], offset: [0, 0.6, 0] })
  factory(room, 'Partition_NE', 'cubiclePartition', 4.2, 0, -2.5, 0, { length: 2.6, height: 1.2 }, { kind: 'furniture', size: [2.6, 1.2, 0.1], offset: [0, 0.6, 0] })
  factory(room, 'Partition_SW', 'cubiclePartition', -4.2, 0, 2.5, 0, { length: 2.6, height: 1.2 }, { kind: 'furniture', size: [2.6, 1.2, 0.1], offset: [0, 0.6, 0] })
  factory(room, 'Partition_SE', 'cubiclePartition', 4.2, 0, 2.8, 0, { length: 2.2, height: 1.2 }, { kind: 'furniture', size: [2.2, 1.2, 0.1], offset: [0, 0.6, 0] })

  officeLayout.desks.forEach((desk, i) => {
    factory(room, `Desk_${i}`, 'desk', desk.x, 0, desk.z, desk.rotation, {}, { kind: 'desk', size: [1.4, 0.8, 0.7], offset: [0, 0.4, 0] })
    const ox = Math.sin(desk.rotation) * 0.65
    const oz = Math.cos(desk.rotation) * 0.65
    factory(room, `Chair_${i}`, 'chair', desk.x + ox, 0, desk.z + oz, desk.rotation + Math.PI)
    if (i === 2 || i === 7 || i === 11) {
      factory(room, `Vase_${i}`, 'lavenderVase', desk.x, 0.75, desk.z)
    }
  })

  factory(room, 'Cabinet_SW', 'cabinet', -6.2, 0, -4.8, Math.PI / 2, {}, { kind: 'cabinet', size: [0.9, 1.5, 0.48], offset: [0, 0.75, 0] })
  factory(room, 'Cabinet_SE', 'cabinet', 6.2, 0, -4.8, -Math.PI / 2, {}, { kind: 'cabinet', size: [0.9, 1.5, 0.48], offset: [0, 0.75, 0] })
  factory(room, 'Cabinet_NW', 'cabinet', -6.2, 0, 4.5, Math.PI / 2, {}, { kind: 'cabinet', size: [0.9, 1.5, 0.48], offset: [0, 0.75, 0] })

  factory(room, 'Plant_A', 'plant', -1.5, 0, -0.8, 0, { large: true })
  factory(room, 'Plant_B', 'plant', 1.8, 0, 0.6, 0, { large: false })
  factory(room, 'Planter_A', 'floorPlanter', 5.8, 0, 4.8)
  factory(room, 'Planter_B', 'floorPlanter', -5.5, 0, -0.5)
  factory(room, 'Notice', 'complianceNotice', -5.2, 0, 4.5, Math.PI)
  factory(room, 'Frame_A', 'wallFrame', 3.5, 2.0, z0 + 0.12, 0, { w: 0.8, h: 0.55 }, undefined, ['architecture'])
  factory(room, 'Frame_B', 'wallFrame', -4.5, 1.9, z0 + 0.12, 0, { w: 0.6, h: 0.45 }, undefined, ['architecture'])
  factory(room, 'Clock', 'wallClock', 0, 2.6, z1 - 0.12, Math.PI, {}, undefined, ['architecture'])
  factory(room, 'Window_N', 'highWindow', 5.5, 2.7, z1 - 0.12, Math.PI, { width: 1.8, height: 0.5 }, undefined, ['architecture'])
  factory(room, 'Window_S', 'highWindow', -5.8, 2.7, z0 + 0.12, 0, { width: 1.5, height: 0.5 }, undefined, ['architecture'])
  factory(room, 'Trash_A', 'trashBin', -2.8, 0, 4.2)
  factory(room, 'Trash_B', 'trashBin', 2.5, 0, -4.5)
  factory(room, 'Vase_floor', 'lavenderVase', -1.2, 0.02, 0.4)
  factory(room, 'Mug', 'mug', 0.8, 0.02, -0.3, 0, { color: 'MAT_CORAL' })

  for (const [i, [lx, lz]] of (
    [
      [-4, -3.5],
      [0, -3.5],
      [4, -3.5],
      [-4, 0],
      [0, 0],
      [4, 0],
      [-4, 3.5],
      [4, 3.5],
    ] as const
  ).entries()) {
    factory(room, `Light_${i}`, 'ceilingLight', lx, h, lz, 0, { color: 0xe8eef2 }, undefined, ['architecture'])
  }
  factory(room, 'Light_W', 'ceilingLight', -6.3, h, 0, 0, { color: 0xc8d4e0 }, undefined, ['architecture'])
  factory(room, 'Light_E', 'ceilingLight', 6.3, h, 0, 0, { color: 0xd0dcc8 }, undefined, ['architecture'])
  factory(room, 'Light_N', 'ceilingLight', 0, h, -5.4, 0, { color: 0xe0d4c0 }, undefined, ['architecture'])
  factory(room, 'Light_S', 'ceilingLight', 0, h, 5.4, 0, { color: 0xe0c8c0 }, undefined, ['architecture'])

  addTrigger(room, 'trigger_spawn', -3.5, 1, 5, 2.5, 2.5, 2.5)
  addTrigger(room, 'trigger_manager_spawn_01', 0, 1, -5, 2, 2.5, 1.5)
  addTrigger(room, 'trigger_manager_spawn_02', 0, 1, 0, 2, 2.5, 2)
}

function buildPrinterRoom(office: SceneGameObject): void {
  const { cx, cz, w, d, h } = ROOM.printer
  const x0 = -w / 2
  const x1 = w / 2
  const z0 = -d / 2
  const z1 = d / 2
  const room = createEmptyObject('PrinterRoom')
  room.tags = ['Room', 'printer']
  place(office, room, cx, 0, cz)

  addFloor(room, 'Floor', w, d)
  addCeiling(room, w, d, h)
  addWall(room, 'Wall_N', 0, z0, w, h, T, 0)
  addWall(room, 'Wall_S', 0, z1, w, h, T, 0)
  addWall(room, 'Wall_W', x0, 0, d, h, T, Math.PI / 2)
  addDoorwayWall(room, 'Wall_E', x1, 0, d, h, T, Math.PI / 2, 'MAT_ACCENT_PRINTER')
  addFloor(office, 'Vestibule_Printer', 0.5, 2, -7.25, 0, 'MAT_DUSTY_BLUE')

  const hide = createPrimitiveBox(0.9, 2, 0.5)
  hide.name = 'HideCabinet'
  place(room, hide, x0 + 0.6, 1, z0 + 0.9)

  factory(room, 'Printer', 'printer', -0.8, 0, -1.2, 0, {}, { kind: 'printer', size: [1.2, 1.1, 0.9], offset: [0, 0.55, 0] })
  factory(room, 'Terminal', 'terminal', 1.2, 0, -1.5, Math.PI, {}, { kind: 'furniture', size: [1.05, 0.85, 0.6], offset: [0, 0.4, 0] })
  factory(room, 'PaperRack', 'paperRack', -1.8, 0, 2.0, Math.PI / 2, {}, { kind: 'furniture', size: [0.7, 1.2, 0.35], offset: [0, 0.6, 0] })
  factory(room, 'Paper_A', 'paperStack', -0.3, 0, -0.4)
  factory(room, 'Paper_B', 'paperStack', -0.3, 0, -0.05)
  factory(room, 'Handbook', 'handbook', 1.2, 0.78, -1.5)
  factory(room, 'Plant', 'plant', 1.8, 0, 2.2)
  factory(room, 'Trash', 'trashBin', 2.0, 0, -2.4)
  factory(room, 'Slogan', 'wallSlogan', x0 + 0.12, 2.15, 1.2, Math.PI / 2, { lines: ['PRINT.', 'FILE.', 'FORGET.'], width: 2.4, height: 0.65 }, undefined, ['architecture'])
  factory(room, 'Frame', 'wallFrame', 0.5, 1.9, z0 + 0.12, 0, { w: 0.55, h: 0.4 }, undefined, ['architecture'])
  factory(room, 'Clock', 'wallClock', -0.2, 2.35, z1 - 0.12, Math.PI, {}, undefined, ['architecture'])
  factory(room, 'Light_A', 'ceilingLight', 0, h, 0, 0, { color: 0xd0dde8 }, undefined, ['architecture'])
  factory(room, 'Light_B', 'ceilingLight', -1.5, h, 1.5, 0, { color: 0xd0dde8 }, undefined, ['architecture'])

  addDoor(room, 'door_printer', x1, 0, -Math.PI / 2, 'printer', 'closed')
  addTrigger(room, 'trigger_rule1_start', 0, 1, 0, w - 1, 2.5, d - 1)
  addTrigger(room, 'trigger_rule1_complete', 1.2, 1, -1.5, 1.5, 2.5, 1.5)
}

function buildBreakRoom(office: SceneGameObject): void {
  const { cx, cz, w, d, h } = ROOM.break
  const x0 = -w / 2
  const x1 = w / 2
  const z0 = -d / 2
  const z1 = d / 2
  const room = createEmptyObject('BreakRoom')
  room.tags = ['Room', 'break']
  place(office, room, cx, 0, cz)

  addFloor(room, 'Floor', w, d)
  addCeiling(room, w, d, h)
  addWall(room, 'Wall_N', 0, z0, w, h, T, 0)
  addWall(room, 'Wall_S', 0, z1, w, h, T, 0)
  addWall(room, 'Wall_E', x1, 0, d, h, T, Math.PI / 2)
  addDoorwayWall(room, 'Wall_W', x0, 0, d, h, T, Math.PI / 2, 'MAT_ACCENT_BREAK')
  addFloor(office, 'Vestibule_Break', 0.5, 1.8, 7.25, 0, 'MAT_SAGE')

  factory(room, 'Coffee', 'coffeeCounter', 1.5, 0, z0 + 1.2, 0, {}, { kind: 'furniture', size: [1.8, 1, 0.7], offset: [0, 0.5, 0] })
  factory(room, 'Cooler', 'waterCooler', 2.2, 0, 1.5, 0, {}, { kind: 'furniture', size: [0.45, 1.2, 0.45], offset: [0, 0.6, 0] })
  factory(room, 'Vending', 'vending', 2.0, 0, z1 - 1.3, Math.PI, {}, { kind: 'furniture', size: [0.95, 1.9, 0.7], offset: [0, 0.95, 0] })
  factory(room, 'Table_A', 'breakTable', -1.0, 0, -1.2, 0, {}, { kind: 'furniture', size: [1.2, 0.75, 1.2], offset: [0, 0.4, 0] })
  factory(room, 'Table_B', 'breakTable', -1.2, 0, 1.5, 0, {}, { kind: 'furniture', size: [1.2, 0.75, 1.2], offset: [0, 0.4, 0] })
  factory(room, 'Sofa', 'sofa', 0.5, 0, z1 - 1.0, Math.PI, {}, { kind: 'furniture', size: [1.6, 0.7, 0.7], offset: [0, 0.35, 0] })
  factory(room, 'Suggestion', 'suggestionBox', -2.2, 0, -2.4)
  factory(room, 'Cup', 'cup', -1.0, 0.78, -1.2)
  factory(room, 'Mug_A', 'mug', -1.15, 0.78, 1.5, 0, { color: 'MAT_BLUSH' })
  factory(room, 'Mug_B', 'mug', 1.4, 0.95, z0 + 1.2, 0, { color: 'MAT_SAGE' })
  factory(room, 'Trash', 'trashBin', -2.4, 0, 2.5)
  factory(room, 'Planter', 'floorPlanter', -2.3, 0, -0.2)
  factory(room, 'Slogan', 'wallSlogan', x1 - 0.12, 2.2, 0, -Math.PI / 2, { lines: ['TAKE A BREAK.', 'THEN RETURN.'], width: 2.8, height: 0.7 }, undefined, ['architecture'])
  factory(room, 'Frame', 'wallFrame', -0.5, 2.0, z0 + 0.12, 0, { w: 0.65, h: 0.45 }, undefined, ['architecture'])
  factory(room, 'Clock', 'wallClock', 0.8, 2.4, z0 + 0.12, 0, {}, undefined, ['architecture'])
  factory(room, 'Window', 'highWindow', -1.5, 2.55, z1 - 0.12, Math.PI, { width: 1.4, height: 0.45 }, undefined, ['architecture'])
  factory(room, 'Npc_A', 'npc', -0.5, 0, -0.3)
  factory(room, 'Npc_B', 'npc', -1.8, 0, 1.2)
  factory(room, 'Npc_C', 'npc', 0.8, 0, 0.8)
  factory(room, 'Light_A', 'ceilingLight', 0, h, 0, 0, { color: 0xe0e8e0 }, undefined, ['architecture'])
  factory(room, 'Light_B', 'ceilingLight', -1.2, h, 1.5, 0, { color: 0xe0e8e0 }, undefined, ['architecture'])

  addDoor(room, 'door_break', x0, 0, Math.PI / 2, 'break', 'closed')
  addTrigger(room, 'trigger_rule2_start', 0, 1, 0, w - 1, 2.5, d - 1)
  addTrigger(room, 'trigger_rule2_complete', -2.2, 1, -2.4, 1.2, 2.5, 1.2)
}

function buildManagerOffice(office: SceneGameObject): void {
  const { cx, cz, w, d, h } = ROOM.manager
  const x0 = -w / 2
  const x1 = w / 2
  const z0 = -d / 2
  const z1 = d / 2
  const room = createEmptyObject('ManagerOffice')
  room.tags = ['Room', 'manager']
  place(office, room, cx, 0, cz)

  addFloor(room, 'Floor', w, d)
  addCeiling(room, w, d, h)
  addWall(room, 'Wall_N', 0, z0, w, h, T, 0, 'MAT_ACCENT_MANAGER')
  addDoorwayWall(room, 'Wall_S', 0, z1, w, h, T, 0, 'MAT_GOLD')
  addWall(room, 'Wall_W', x0, 0, d, h, T, Math.PI / 2)
  addWall(room, 'Wall_E', x1, 0, d, h, T, Math.PI / 2)
  addFloor(office, 'Vestibule_Manager', 2, 1, 0, -6.5, 'MAT_GOLD')

  for (const side of [-1, 1]) {
    const panel = createPrimitiveBox(0.08, 2.2, 2.4)
    panel.name = side < 0 ? 'Panel_W' : 'Panel_E'
    place(room, panel, side * 3.2, 1.4, -0.5)
    const gold = createPrimitiveBox(0.1, 0.06, 2.2)
    gold.name = side < 0 ? 'Gold_W' : 'Gold_E'
    place(room, gold, side * 3.2, 2.4, -0.5)
  }

  factory(room, 'Desk', 'managerDesk', 0, 0, z0 + 1.6, 0, {}, { kind: 'desk', size: [2.2, 0.8, 0.9], offset: [0, 0.4, 0] })
  factory(room, 'Proposal', 'proposal', 0, 0.82, z0 + 1.6)
  factory(room, 'Card_A', 'evidenceCard', -2.5, 0.02, 0.5)
  factory(room, 'Card_B', 'evidenceCard', 2.8, 0.02, -1.2)
  factory(room, 'Card_C', 'evidenceCard', -1.2, 0.82, z0 + 1.4)
  factory(room, 'Plant_W', 'plant', -3.0, 0, z0 + 1.2, 0, { large: true })
  factory(room, 'Plant_E', 'plant', 3.0, 0, z0 + 1.2, 0, { large: true })
  factory(room, 'Vase', 'lavenderVase', -1.5, 0.82, z0 + 1.5)
  factory(room, 'Frame_W', 'wallFrame', -3.15, 1.8, 1.2, Math.PI / 2, { w: 0.7, h: 0.5 }, undefined, ['architecture'])
  factory(room, 'Frame_E', 'wallFrame', 3.15, 1.8, 1.2, -Math.PI / 2, { w: 0.7, h: 0.5 }, undefined, ['architecture'])
  factory(room, 'Clock', 'wallClock', 0, 3.2, z0 + 0.12, 0, {}, undefined, ['architecture'])
  factory(room, 'Window_W', 'highWindow', -2.5, 3.3, z0 + 0.12, 0, { width: 1.4, height: 0.45 }, undefined, ['architecture'])
  factory(room, 'Window_E', 'highWindow', 2.5, 3.3, z0 + 0.12, 0, { width: 1.4, height: 0.45 }, undefined, ['architecture'])
  factory(room, 'Light_A', 'ceilingLight', 0, h, 0, 0, { color: 0xd0d4d8 }, undefined, ['architecture'])
  factory(room, 'Light_B', 'ceilingLight', 0, h, z0 + 1.5, 0, { color: 0xe0d4b8 }, undefined, ['architecture'])

  addDoor(room, 'door_manager', 0, z1, 0, 'manager', 'closed')
  addTrigger(room, 'trigger_rule3_start', 0, 1, 0, w - 1.5, 2.5, d - 1.5)
}

function buildMeetingRoom(office: SceneGameObject): void {
  const { cx, cz, w, d, h } = ROOM.meeting
  const x0 = -w / 2
  const x1 = w / 2
  const z0 = -d / 2
  const z1 = d / 2
  const room = createEmptyObject('MeetingRoom')
  room.tags = ['Room', 'meeting']
  place(office, room, cx, 0, cz)

  addFloor(room, 'Floor', w, d)
  addCeiling(room, w, d, h)
  addDoorwayWall(room, 'Wall_N', 0, z0, w, h, T, 0, 'MAT_ACCENT_MEETING')
  addWall(room, 'Wall_S', 0, z1, w, h, T, 0)
  addWall(room, 'Wall_W', x0, 0, d, h, T, Math.PI / 2)
  addWall(room, 'Wall_E', x1, 0, d, h, T, Math.PI / 2)
  addFloor(office, 'Vestibule_Meeting', 2, 0.5, 0, 6.25, 'MAT_CORAL')

  factory(room, 'Table', 'meetingTable', 0, 0, 0, 0, {}, { kind: 'desk', size: [4.2, 0.8, 1.6], offset: [0, 0.4, 0] })

  const seats = [
    { x: -1.5, z: -1.1, r: 0 },
    { x: 0, z: -1.1, r: 0 },
    { x: 1.5, z: -1.1, r: 0 },
    { x: -1.5, z: 1.1, r: Math.PI },
    { x: 0, z: 1.1, r: Math.PI },
    { x: 1.5, z: 1.1, r: Math.PI },
    { x: -2.6, z: 0, r: Math.PI / 2 },
    { x: 2.6, z: 0, r: -Math.PI / 2 },
  ]
  seats.forEach((s, i) => {
    factory(room, `Chair_${i}`, 'chair', s.x, 0, s.z, s.r)
    factory(room, `Npc_${i}`, 'npc', s.x, 0, s.z + (s.r === 0 ? -0.15 : s.r === Math.PI ? 0.15 : 0))
  })

  const voice = createPrimitiveBox(1, 2.2, 0.12)
  voice.name = 'VoiceDoor'
  place(room, voice, x1 - 0.3, 1.1, 2.5)
  const btn = createPrimitiveBox(0.1, 0.1, 0.05)
  btn.name = 'HiddenButton'
  place(room, btn, x0 + 0.15, 1.0, -2.8)

  factory(room, 'Cup', 'cup', 0.4, 0.82, 0)
  factory(room, 'Mug', 'mug', -0.5, 0.82, 0, 0, { color: 'MAT_LILAC' })
  factory(room, 'Slogan', 'wallSlogan', 0, 3.2, z1 - 0.12, Math.PI, { lines: ['THIS MEETING COULD', 'HAVE BEEN AN EMAIL.'], width: 4.2, height: 0.9 }, undefined, ['architecture'])
  factory(room, 'Frame_W', 'wallFrame', x0 + 0.12, 2.4, -2, Math.PI / 2, { w: 0.8, h: 0.55 }, undefined, ['architecture'])
  factory(room, 'Frame_E', 'wallFrame', x1 - 0.12, 2.4, 2, -Math.PI / 2, { w: 0.8, h: 0.55 }, undefined, ['architecture'])
  factory(room, 'Clock', 'wallClock', 0, 3.6, z0 + 0.12, 0, {}, undefined, ['architecture'])
  factory(room, 'Light_A', 'ceilingLight', -2, h, 0, 0, { color: 0xc8d4e0 }, undefined, ['architecture'])
  factory(room, 'Light_B', 'ceilingLight', 2, h, 0, 0, { color: 0xc8d4e0 }, undefined, ['architecture'])
  factory(room, 'Light_C', 'ceilingLight', 0, h, 2, 0, { color: 0xb0c0d0 }, undefined, ['architecture'])

  addDoor(room, 'door_meeting', 0, z0, Math.PI, 'meeting', 'closed')
  addTrigger(room, 'trigger_boss_start', 0, 1, 0, 3, 2.5, 2)
  addTrigger(room, 'trigger_boss_phase_02', -2, 1, 2, 2, 2.5, 2)
  addTrigger(room, 'trigger_boss_phase_03', 2, 1, -2, 2, 2.5, 2)
  addTrigger(room, 'trigger_ending', 0, 1, z1 - 1.5, 3, 2.5, 2)
}

function buildShared(office: SceneGameObject): void {
  factory(office, 'Column_A', 'column', -2.2, 0, 3.4, 0, { height: 3 }, { kind: 'wall', size: [0.4, 3, 0.4], offset: [0, 1.5, 0] }, ['architecture'])
  factory(office, 'Column_B', 'column', 2.2, 0, 3.4, 0, { height: 3 }, { kind: 'wall', size: [0.4, 3, 0.4], offset: [0, 1.5, 0] }, ['architecture'])
  factory(office, 'Column_PW', 'column', -7.25, 0, -1.1, 0, { height: 3 }, { kind: 'wall', size: [0.4, 3, 0.4], offset: [0, 1.5, 0] }, ['architecture'])
  factory(office, 'Column_PE', 'column', -7.25, 0, 1.1, 0, { height: 3 }, { kind: 'wall', size: [0.4, 3, 0.4], offset: [0, 1.5, 0] }, ['architecture'])
  factory(office, 'Column_BW', 'column', 7.25, 0, -1.0, 0, { height: 3 }, { kind: 'wall', size: [0.4, 3, 0.4], offset: [0, 1.5, 0] }, ['architecture'])
  factory(office, 'Column_BE', 'column', 7.25, 0, 1.0, 0, { height: 3 }, { kind: 'wall', size: [0.4, 3, 0.4], offset: [0, 1.5, 0] }, ['architecture'])

  const lights: Array<[number, number, number, number, number, number]> = [
    [0, 2.8, 0, 0xe8eef4, 4.5, 22],
    [-8, 2.5, 0, 0xd8e4f0, 3.2, 14],
    [8, 2.5, 0, 0xdce8d8, 3.2, 14],
    [0, 3.0, -8, 0xe8e0d0, 2.8, 13],
    [0, 3.2, 9, 0xd8e0e8, 3.0, 14],
    [-3.5, 2.6, 4, 0xe8eef2, 2.5, 10],
  ]
  const lighting = createEmptyObject('Lighting')
  office.addChild(lighting)
  lights.forEach((l, i) => {
    const go = createFillLight({ color: l[3], intensity: l[4], distance: l[5] })
    go.name = `Fill_${i}`
    place(lighting, go, l[0], l[1], l[2])
  })
  const ambient = createFillLight({ kind: 'ambient', color: 0xd0d6dc, intensity: 0.35 })
  ambient.name = 'Ambient'
  lighting.addChild(ambient)

  const characters = createEmptyObject('Characters')
  office.addChild(characters)
  const manager = factory(characters, 'Manager', 'npc', 0, 0, -10, 0, { colorKey: 'MAT_MANAGER', height: 1.85 })
  const script = manager.addComponent(ScriptComponent)
  script.scriptId = 'ManagerPatrol'
  script.fields = { speed: 1.6, waypoints: officeLayout.managerWaypoints }

  const spawn = createSpawnPoint()
  place(office, spawn, officeLayout.spawn.x, 0, officeLayout.spawn.z, officeLayout.spawn.yaw)
}
