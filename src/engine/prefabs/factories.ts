import * as THREE from 'three'
import type { PaletteKey } from '../../theme/palette'
import { ColliderWorld, type ColliderBox } from '../../world/colliders'
import {
  createCeiling,
  createCeilingLight,
  createColumn,
  createCubiclePartition,
  createFloor,
  createGlassWall,
  createWall,
  createWallSlogan,
  createWallWithDoorway,
} from '../../world/architecture'
import {
  createCabinet,
  createChair,
  createCoffeeCounter,
  createComplianceNotice,
  createCup,
  createDesk,
  createEvidenceCard,
  createHandbook,
  createManagerDesk,
  createMeetingTable,
  createBreakTable,
  createNpc,
  createPaperStack,
  createPlant,
  createPrinter,
  createProposal,
  createSofa,
  createSuggestionBox,
  createTerminal,
  createWaterCooler,
} from '../../world/furniture'
import {
  createFloorPlanter,
  createHighWindow,
  createLavenderVase,
  createPaperRack,
  createPersonalizedMug,
  createTrashBin,
  createVendingMachine,
  createWallClock,
  createWallFrame,
} from '../../world/dressing'
import { SceneGameObject } from '../SceneGameObject'
import { RenderComponent } from '../components/RenderComponent'
import { CollisionComponent } from '../components/CollisionComponent'
import { DoorComponent, type DoorAccent } from '../components/DoorComponent'
import { TriggerComponent } from '../components/TriggerComponent'
import { LightComponent, type LightKind } from '../components/LightComponent'
import type { Vec3Tuple } from '../ids'
import type { DoorState } from '../../world/doors'

const discard = new ColliderWorld()

function num(args: Record<string, unknown>, key: string, fallback: number): number {
  const v = Number(args[key])
  return Number.isFinite(v) ? v : fallback
}

function str(args: Record<string, unknown>, key: string, fallback: string): string {
  return typeof args[key] === 'string' ? (args[key] as string) : fallback
}

function bool(args: Record<string, unknown>, key: string, fallback: boolean): boolean {
  return typeof args[key] === 'boolean' ? (args[key] as boolean) : fallback
}

function palette(args: Record<string, unknown>, key: string, fallback: PaletteKey): PaletteKey {
  const v = args[key]
  return typeof v === 'string' ? (v as PaletteKey) : fallback
}

export function runFactory(
  parent: THREE.Object3D,
  factoryId: string,
  args: Record<string, unknown> = {},
): void {
  discard.clear()
  switch (factoryId) {
    case 'floor':
      createFloor(parent, discard, 0, 0, num(args, 'w', 4), num(args, 'd', 4), palette(args, 'matKey', 'MAT_FLOOR'))
      break
    case 'ceiling':
      createCeiling(parent, 0, 0, num(args, 'w', 4), num(args, 'd', 4), num(args, 'y', 3.2))
      break
    case 'wall':
      createWall(
        parent,
        discard,
        0,
        0,
        num(args, 'length', 4),
        num(args, 'height', 3),
        num(args, 'thickness', 0.2),
        0,
        palette(args, 'matKey', 'MAT_WALL'),
      )
      break
    case 'wallDoorway':
      createWallWithDoorway(
        parent,
        discard,
        0,
        0,
        num(args, 'length', 6),
        num(args, 'height', 3),
        num(args, 'thickness', 0.2),
        0,
        num(args, 'doorWidth', 1.1),
        num(args, 'doorHeight', 2.2),
        palette(args, 'matKey', 'MAT_WALL'),
      )
      break
    case 'glassWall':
      createGlassWall(
        parent,
        discard,
        0,
        0,
        num(args, 'length', 2.4),
        num(args, 'height', 2.4),
        num(args, 'thickness', 0.06),
        0,
      )
      break
    case 'column':
      createColumn(parent, discard, 0, 0, num(args, 'height', 3))
      break
    case 'ceilingLight':
      createCeilingLight(parent, 0, 0, 0, num(args, 'color', 0xe8eef2), num(args, 'intensity', 2.2))
      break
    case 'wallSlogan': {
      const lines = Array.isArray(args.lines) ? (args.lines as unknown[]).map(String) : ['WORK.']
      createWallSlogan(parent, lines, 0, 0, 0, 0, num(args, 'width', 3.2), num(args, 'height', 0.9))
      break
    }
    case 'cubiclePartition':
      createCubiclePartition(parent, discard, 0, 0, num(args, 'length', 2.6), 0, num(args, 'height', 1.15))
      break
    case 'desk':
      createDesk(parent, discard, 0, 0, 0, false, bool(args, 'withAccents', false))
      break
    case 'chair':
      createChair(parent, 0, 0, 0)
      break
    case 'cabinet':
      createCabinet(parent, discard, 0, 0, 0)
      break
    case 'printer':
      createPrinter(parent, discard, 0, 0)
      break
    case 'terminal':
      createTerminal(parent, discard, 0, 0, 0)
      break
    case 'paperStack':
      createPaperStack(parent, 0, 0)
      break
    case 'plant':
      createPlant(parent, 0, 0, bool(args, 'large', false))
      break
    case 'meetingTable':
      createMeetingTable(parent, discard, 0, 0)
      break
    case 'breakTable':
      createBreakTable(parent, discard, 0, 0)
      break
    case 'coffeeCounter':
      createCoffeeCounter(parent, discard, 0, 0, 0)
      break
    case 'waterCooler':
      createWaterCooler(parent, discard, 0, 0)
      break
    case 'suggestionBox':
      createSuggestionBox(parent, 0, 0)
      break
    case 'cup':
      createCup(parent, 0, 0, 0)
      break
    case 'proposal':
      createProposal(parent, 0, 0, 0)
      break
    case 'handbook':
      createHandbook(parent, 0, 0, 0)
      break
    case 'evidenceCard':
      createEvidenceCard(parent, 0, 0, 0)
      break
    case 'npc':
      createNpc(
        parent,
        0,
        0,
        str(args, 'colorKey', 'MAT_NPC') as 'MAT_NPC' | 'MAT_MANAGER',
        num(args, 'height', 1.7),
      )
      break
    case 'complianceNotice':
      createComplianceNotice(parent, 0, 0, 0)
      break
    case 'managerDesk':
      createManagerDesk(parent, discard, 0, 0)
      break
    case 'sofa':
      createSofa(parent, discard, 0, 0, 0)
      break
    case 'vending':
      createVendingMachine(parent, discard, 0, 0, 0)
      break
    case 'lavenderVase':
      createLavenderVase(parent, 0, 0, 0)
      break
    case 'wallFrame':
      createWallFrame(parent, 0, 0, 0, 0, num(args, 'w', 0.7), num(args, 'h', 0.5))
      break
    case 'highWindow':
      createHighWindow(parent, 0, 0, 0, 0, num(args, 'width', 1.6), num(args, 'height', 0.55))
      break
    case 'trashBin':
      createTrashBin(parent, 0, 0)
      break
    case 'paperRack':
      createPaperRack(parent, discard, 0, 0, 0)
      break
    case 'mug':
      createPersonalizedMug(
        parent,
        0,
        0,
        0,
        str(args, 'color', 'MAT_BLUSH') as 'MAT_BLUSH' | 'MAT_CORAL' | 'MAT_LILAC' | 'MAT_SAGE',
      )
      break
    case 'wallClock':
      createWallClock(parent, 0, 0, 0, 0)
      break
    case 'floorPlanter':
      createFloorPlanter(parent, 0, 0)
      break
    default:
      break
  }
}

export function hydrateGameObject(go: SceneGameObject): void {
  const door = go.getComponent(DoorComponent)
  if (door) door.rebuildVisual()

  const light = go.getComponent(LightComponent)
  if (light) light.rebuild()

  const render = go.getComponent(RenderComponent)
  if (!render) return
  if (render.source.source === 'primitive') {
    render.rebuildPrimitive()
  } else if (render.source.source === 'factory') {
    render.clearVisual()
    runFactory(go.node, render.source.factoryId, render.source.args ?? {})
    render.applyMaterialOverrides()
    render.applyShadow()
  }
}

export function createFactoryObject(
  name: string,
  factoryId: string,
  args: Record<string, unknown> = {},
  collision?: { kind: ColliderBox['kind']; size: Vec3Tuple; offset?: Vec3Tuple },
  tags: string[] = [],
): SceneGameObject {
  const go = new SceneGameObject(name)
  go.prefabId = factoryId
  go.tags = [...tags]
  runFactory(go.node, factoryId, args)
  const render = go.addComponent(RenderComponent)
  render.source = { source: 'factory', factoryId, args }
  render.applyShadow()
  if (collision) {
    const col = go.addComponent(CollisionComponent)
    col.kind = collision.kind
    col.size = collision.size
    col.offset = collision.offset ?? [0, collision.size[1] / 2, 0]
  }
  return go
}

export function createPrimitiveBox(sx = 1, sy = 1, sz = 1): SceneGameObject {
  const go = new SceneGameObject('Box')
  go.prefabId = 'box'
  go.tags = ['primitive']
  const render = go.addComponent(RenderComponent)
  render.source = { source: 'primitive', geo: 'box', args: [sx, sy, sz] }
  render.rebuildPrimitive()
  const col = go.addComponent(CollisionComponent)
  col.kind = 'furniture'
  col.size = [sx, sy, sz]
  col.offset = [0, 0, 0]
  return go
}

export function createEmptyObject(name = 'Empty'): SceneGameObject {
  const go = new SceneGameObject(name)
  go.prefabId = 'empty'
  const render = go.addComponent(RenderComponent)
  render.source = { source: 'empty' }
  return go
}

export function createDoorObject(opts: {
  doorId: string
  width?: number
  height?: number
  accent?: DoorAccent
  state?: DoorState
}): SceneGameObject {
  const go = new SceneGameObject(opts.doorId)
  go.prefabId = 'door'
  go.tags = ['door']
  const door = go.addComponent(DoorComponent)
  door.doorId = opts.doorId
  door.width = opts.width ?? 1.1
  door.height = opts.height ?? 2.2
  door.accent = opts.accent ?? 'printer'
  door.state = opts.state ?? 'closed'
  door.rebuildVisual()
  const col = go.addComponent(CollisionComponent)
  col.kind = 'door'
  col.size = [door.width, door.height, 0.12]
  col.offset = [0, door.height / 2, 0]
  col.enabled = door.state !== 'open'
  return go
}

export function createTriggerObject(triggerId: string, size: Vec3Tuple = [2, 2.5, 2]): SceneGameObject {
  const go = new SceneGameObject(triggerId)
  go.prefabId = 'trigger'
  go.tags = ['trigger']
  const tr = go.addComponent(TriggerComponent)
  tr.triggerId = triggerId
  tr.size = size
  const render = go.addComponent(RenderComponent)
  render.source = { source: 'empty' }
  return go
}

export function createSpawnPoint(): SceneGameObject {
  const go = createEmptyObject('Spawn')
  go.prefabId = 'spawn'
  go.tags = ['Spawn']
  return go
}

export function createFillLight(opts?: {
  kind?: LightKind
  color?: number
  intensity?: number
  distance?: number
}): SceneGameObject {
  const go = new SceneGameObject('FillLight')
  go.prefabId = 'fillLight'
  go.tags = ['light']
  const light = go.addComponent(LightComponent)
  light.kind = opts?.kind ?? 'point'
  light.color = opts?.color ?? 0xe0e8f0
  light.intensity = opts?.intensity ?? 1.8
  light.distance = opts?.distance ?? 16
  light.rebuild()
  return go
}

export function createRoomShell(opts: {
  name?: string
  w: number
  d: number
  h: number
  wallT?: number
  matKey?: PaletteKey
}): SceneGameObject {
  const w = opts.w
  const d = opts.d
  const h = opts.h
  const t = opts.wallT ?? 0.2
  const mat = opts.matKey ?? 'MAT_WALL'
  const root = createEmptyObject(opts.name ?? 'Room')
  root.prefabId = 'roomShell'
  root.tags = ['Room']

  const floor = createFactoryObject('Floor', 'floor', { w, d }, undefined, ['architecture'])
  root.addChild(floor)

  const ceil = createFactoryObject('Ceiling', 'ceiling', { w, d, y: h }, undefined, ['architecture'])
  root.addChild(ceil)

  const north = createFactoryObject(
    'Wall_N',
    'wall',
    { length: w, height: h, thickness: t, matKey: mat },
    { kind: 'wall', size: [w, h, t], offset: [0, h / 2, 0] },
    ['architecture'],
  )
  north.transform.setPosition(0, 0, -d / 2)
  root.addChild(north)

  const south = createFactoryObject(
    'Wall_S',
    'wall',
    { length: w, height: h, thickness: t, matKey: mat },
    { kind: 'wall', size: [w, h, t], offset: [0, h / 2, 0] },
    ['architecture'],
  )
  south.transform.setPosition(0, 0, d / 2)
  root.addChild(south)

  const west = createFactoryObject(
    'Wall_W',
    'wall',
    { length: d, height: h, thickness: t, matKey: mat },
    { kind: 'wall', size: [d, h, t], offset: [0, h / 2, 0] },
    ['architecture'],
  )
  west.transform.setPosition(-w / 2, 0, 0)
  west.transform.setEuler(0, Math.PI / 2, 0)
  root.addChild(west)

  const east = createFactoryObject(
    'Wall_E',
    'wall',
    { length: d, height: h, thickness: t, matKey: mat },
    { kind: 'wall', size: [d, h, t], offset: [0, h / 2, 0] },
    ['architecture'],
  )
  east.transform.setPosition(w / 2, 0, 0)
  east.transform.setEuler(0, Math.PI / 2, 0)
  root.addChild(east)

  return root
}
