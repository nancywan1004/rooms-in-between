import { Scene } from '../Scene'
import { SceneGameObject } from '../SceneGameObject'
import {
  createDoorObject,
  createEmptyObject,
  createFactoryObject,
  createFillLight,
  createPrimitiveBox,
  createRoomShell,
  createSpawnPoint,
  createTriggerObject,
} from './factories'
import type { ColliderBox } from '../../world/colliders'
import type { Vec3Tuple } from '../ids'
import type { PaletteKey } from '../../theme/palette'
import type { DoorAccent } from '../components/DoorComponent'
import type { DoorState } from '../../world/doors'

export type PrefabCategory = 'primitive' | 'architecture' | 'furniture' | 'gameplay'

export type PrefabDef = {
  id: string
  label: string
  category: PrefabCategory
  spawn: () => SceneGameObject
}

function furn(
  id: string,
  label: string,
  factoryId: string,
  collision?: { kind: ColliderBox['kind']; size: Vec3Tuple; offset?: Vec3Tuple },
  args: Record<string, unknown> = {},
): PrefabDef {
  return {
    id,
    label,
    category: 'furniture',
    spawn: () => createFactoryObject(label, factoryId, args, collision, ['furniture']),
  }
}

function arch(
  id: string,
  label: string,
  factoryId: string,
  args: Record<string, unknown>,
  collision?: { kind: ColliderBox['kind']; size: Vec3Tuple; offset?: Vec3Tuple },
): PrefabDef {
  return {
    id,
    label,
    category: 'architecture',
    spawn: () => createFactoryObject(label, factoryId, args, collision, ['architecture']),
  }
}

export const PREFABS: PrefabDef[] = [
  { id: 'empty', label: 'Empty', category: 'primitive', spawn: () => createEmptyObject('Empty') },
  { id: 'box', label: 'Box', category: 'primitive', spawn: () => createPrimitiveBox(1, 1, 1) },
  {
    id: 'roomShell',
    label: 'Room Shell',
    category: 'architecture',
    spawn: () => createRoomShell({ w: 6, d: 7, h: 3 }),
  },
  arch('floor', 'Floor', 'floor', { w: 4, d: 4 }),
  arch('ceiling', 'Ceiling', 'ceiling', { w: 4, d: 4, y: 3.2 }),
  arch('wall', 'Wall', 'wall', { length: 4, height: 3, thickness: 0.2, matKey: 'MAT_WALL' as PaletteKey }, {
    kind: 'wall',
    size: [4, 3, 0.2],
    offset: [0, 1.5, 0],
  }),
  arch(
    'wallDoorway',
    'Wall + Doorway',
    'wallDoorway',
    { length: 6, height: 3, thickness: 0.2, doorWidth: 1.1, doorHeight: 2.2 },
    { kind: 'wall', size: [6, 3, 0.2], offset: [0, 1.5, 0] },
  ),
  arch('glassWall', 'Glass Wall', 'glassWall', { length: 2.4, height: 2.4, thickness: 0.06 }, {
    kind: 'wall',
    size: [2.4, 2.4, 0.06],
    offset: [0, 1.2, 0],
  }),
  arch('column', 'Column', 'column', { height: 3 }, { kind: 'wall', size: [0.4, 3, 0.4], offset: [0, 1.5, 0] }),
  arch('ceilingLight', 'Ceiling Light', 'ceilingLight', { color: 0xe8eef2 }),
  arch('wallSlogan', 'Wall Slogan', 'wallSlogan', { lines: ['WORK.', 'OBEY.'], width: 3.2, height: 0.9 }),
  arch('cubiclePartition', 'Cubicle', 'cubiclePartition', { length: 2.6, height: 1.15 }, {
    kind: 'furniture',
    size: [2.6, 1.15, 0.1],
    offset: [0, 0.57, 0],
  }),
  furn('desk', 'Desk', 'desk', { kind: 'desk', size: [1.4, 0.8, 0.7], offset: [0, 0.4, 0] }),
  furn('chair', 'Chair', 'chair'),
  furn('cabinet', 'Cabinet', 'cabinet', { kind: 'cabinet', size: [0.9, 1.5, 0.48], offset: [0, 0.75, 0] }),
  furn('printer', 'Printer', 'printer', { kind: 'printer', size: [1.2, 1.1, 0.9], offset: [0, 0.55, 0] }),
  furn('terminal', 'Terminal', 'terminal', { kind: 'furniture', size: [1.05, 0.85, 0.6], offset: [0, 0.4, 0] }),
  furn('paperStack', 'Paper Stack', 'paperStack'),
  furn('plant', 'Plant', 'plant'),
  furn('meetingTable', 'Meeting Table', 'meetingTable', { kind: 'desk', size: [4.2, 0.8, 1.6], offset: [0, 0.4, 0] }),
  furn('breakTable', 'Break Table', 'breakTable', { kind: 'furniture', size: [1.2, 0.75, 1.2], offset: [0, 0.4, 0] }),
  furn('coffeeCounter', 'Coffee Counter', 'coffeeCounter', { kind: 'furniture', size: [1.8, 1, 0.7], offset: [0, 0.5, 0] }),
  furn('waterCooler', 'Water Cooler', 'waterCooler', { kind: 'furniture', size: [0.45, 1.2, 0.45], offset: [0, 0.6, 0] }),
  furn('suggestionBox', 'Suggestion Box', 'suggestionBox'),
  furn('cup', 'Cup', 'cup'),
  furn('proposal', 'Proposal', 'proposal'),
  furn('handbook', 'Handbook', 'handbook'),
  furn('evidenceCard', 'Evidence Card', 'evidenceCard'),
  furn('npc', 'NPC', 'npc'),
  furn('complianceNotice', 'Notice Board', 'complianceNotice'),
  furn('managerDesk', 'Manager Desk', 'managerDesk', { kind: 'desk', size: [2.2, 0.8, 0.9], offset: [0, 0.4, 0] }),
  furn('sofa', 'Sofa', 'sofa', { kind: 'furniture', size: [1.6, 0.7, 0.7], offset: [0, 0.35, 0] }),
  furn('vending', 'Vending', 'vending', { kind: 'furniture', size: [0.95, 1.9, 0.7], offset: [0, 0.95, 0] }),
  furn('lavenderVase', 'Lavender', 'lavenderVase'),
  furn('wallFrame', 'Wall Frame', 'wallFrame', undefined, { w: 0.7, h: 0.5 }),
  furn('highWindow', 'High Window', 'highWindow'),
  furn('trashBin', 'Trash Bin', 'trashBin'),
  furn('paperRack', 'Paper Rack', 'paperRack', { kind: 'furniture', size: [0.7, 1.2, 0.35], offset: [0, 0.6, 0] }),
  furn('mug', 'Mug', 'mug'),
  furn('wallClock', 'Wall Clock', 'wallClock'),
  furn('floorPlanter', 'Floor Planter', 'floorPlanter'),
  {
    id: 'door',
    label: 'Door',
    category: 'gameplay',
    spawn: () => createDoorObject({ doorId: 'door', accent: 'printer' as DoorAccent, state: 'closed' as DoorState }),
  },
  { id: 'trigger', label: 'Trigger', category: 'gameplay', spawn: () => createTriggerObject('trigger') },
  { id: 'spawn', label: 'Spawn Point', category: 'gameplay', spawn: () => createSpawnPoint() },
  { id: 'fillLight', label: 'Fill Light', category: 'gameplay', spawn: () => createFillLight() },
]

const byId = new Map(PREFABS.map((p) => [p.id, p]))

export function getPrefab(id: string): PrefabDef | undefined {
  return byId.get(id)
}

export function spawnPrefab(id: string, scene: Scene, parent?: SceneGameObject | null): SceneGameObject | null {
  const def = byId.get(id)
  if (!def) return null
  const go = def.spawn()
  if (parent) parent.addChild(go)
  else scene.add(go)
  return go
}
