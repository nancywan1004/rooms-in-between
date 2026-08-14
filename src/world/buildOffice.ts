import * as THREE from 'three'
import { createColumn, createDoorVisual, createRoomFillLight, syncDoorVisual, type DoorVisual } from './architecture'
import type { ColliderWorld } from './colliders'
import type { DoorRegistry } from './doors'
import type { TriggerRegistry } from './triggers'
import { officeLayout } from './layout'
import { buildOpenOffice } from './rooms/buildOpenOffice'
import { buildPrinterRoom } from './rooms/buildPrinterRoom'
import { buildBreakRoom } from './rooms/buildBreakRoom'
import { buildManagerOffice } from './rooms/buildManagerOffice'
import { buildMeetingRoom } from './rooms/buildMeetingRoom'
import { beginWorldBatch, flushWorldBatch } from './batching'
import { ManagerPatrol } from '../systems/ManagerPatrol'
import { CrtFlicker } from '../systems/CrtFlicker'

export type OfficeWorld = {
  root: THREE.Group
  doorVisuals: Map<string, DoorVisual>
  manager: ManagerPatrol
  lighting: THREE.Group
  crtFlicker: CrtFlicker
}

export function buildOffice(
  scene: THREE.Scene,
  colliders: ColliderWorld,
  doors: DoorRegistry,
  triggers: TriggerRegistry,
): OfficeWorld {
  const root = new THREE.Group()
  root.name = 'Office'

  const environment = new THREE.Group()
  environment.name = 'Environment'
  const architecture = new THREE.Group()
  architecture.name = 'Architecture'
  environment.add(architecture)

  const rooms = new THREE.Group()
  rooms.name = 'Rooms'

  const props = new THREE.Group()
  props.name = 'Props'
  const propsStatic = new THREE.Group()
  propsStatic.name = 'Static'
  props.add(propsStatic)

  const characters = new THREE.Group()
  characters.name = 'Characters'

  const gameplay = new THREE.Group()
  gameplay.name = 'Gameplay'

  const lighting = new THREE.Group()
  lighting.name = 'Lighting'

  root.add(environment, rooms, props, characters, gameplay, lighting)
  scene.add(root)

  beginWorldBatch()

  buildOpenOffice(rooms, architecture, propsStatic, colliders, doors, triggers)
  buildPrinterRoom(rooms, architecture, propsStatic, colliders, doors, triggers)
  buildBreakRoom(rooms, architecture, propsStatic, characters, colliders, doors, triggers)
  buildManagerOffice(rooms, architecture, propsStatic, colliders, doors, triggers)
  buildMeetingRoom(rooms, architecture, propsStatic, characters, colliders, doors, triggers)

  // Flush merged walls + instanced chairs / panels / desks
  flushWorldBatch(architecture)

  // Chase sightline columns in open office
  createColumn(architecture, colliders, -2.2, 0, 3.4)
  createColumn(architecture, colliders, 2.2, 0, 3.4)

  // Corridor connector walls (fill gaps between rooms)
  buildCorridorConnectors(architecture, colliders)

  // Door visuals
  const doorVisuals = new Map<string, DoorVisual>()
  for (const record of doors.all()) {
    const visual = createDoorVisual(architecture, record)
    syncDoorVisual(visual, record.state)
    // Closed/locked doors block; open doors remove collider
    updateDoorCollider(colliders, record.id, record.state, record)
    doorVisuals.set(record.id, visual)
  }

  doors.onChange((record) => {
    const visual = doorVisuals.get(record.id)
    if (visual) syncDoorVisual(visual, record.state)
    updateDoorCollider(colliders, record.id, record.state, record)
  })

  // Invisible trigger helpers (debug wireframe off by default)
  const triggerGroup = new THREE.Group()
  triggerGroup.name = 'Triggers'
  gameplay.add(triggerGroup)
  for (const z of triggers.getZones()) {
    const sx = z.max.x - z.min.x
    const sy = z.max.y - z.min.y
    const sz = z.max.z - z.min.z
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      new THREE.MeshBasicMaterial({
        color: 0x88ffaa,
        wireframe: true,
        transparent: true,
        opacity: 0,
      }),
    )
    mesh.position.set((z.min.x + z.max.x) / 2, (z.min.y + z.max.y) / 2, (z.min.z + z.max.z) / 2)
    mesh.name = z.id
    triggerGroup.add(mesh)
  }

  // Pressure desk slot markers (invisible placeholders)
  const pressureGroup = new THREE.Group()
  pressureGroup.name = 'PressureDeskSlots'
  gameplay.add(pressureGroup)
  for (const [i, slot] of officeLayout.pressureDeskSlots.entries()) {
    const marker = new THREE.Object3D()
    marker.name = `pressure_slot_${i}`
    marker.position.set(slot.x, 0, slot.z)
    marker.rotation.y = slot.rotation
    pressureGroup.add(marker)
  }

  const manager = new ManagerPatrol(characters, officeLayout.managerWaypoints)

  // Sparse realtime fills — strong enough that non-emissive geometry is readable
  createRoomFillLight(lighting, 0, 2.8, 0, 0xe8eef4, 4.5, 22)
  createRoomFillLight(lighting, -8, 2.5, 0, 0xd8e4f0, 3.2, 14)
  createRoomFillLight(lighting, 8, 2.5, 0, 0xdce8d8, 3.2, 14)
  createRoomFillLight(lighting, 0, 3.0, -8, 0xe8e0d0, 2.8, 13)
  createRoomFillLight(lighting, 0, 3.2, 9, 0xd8e0e8, 3.0, 14)
  createRoomFillLight(lighting, -3.5, 2.6, 4, 0xe8eef2, 2.5, 10)

  const fill = new THREE.AmbientLight(0xd0d6dc, 0.35)
  lighting.add(fill)

  const crtFlicker = new CrtFlicker()
  crtFlicker.collect(root)

  return { root, doorVisuals, manager, lighting, crtFlicker }
}

function updateDoorCollider(
  colliders: ColliderWorld,
  id: string,
  state: string,
  record: { x: number; z: number; width: number; height: number; rotationY: number },
): void {
  const colliderId = `doorcol_${id}`
  colliders.removeById(colliderId)
  if (state === 'open') return

  const cos = Math.abs(Math.cos(record.rotationY))
  const sin = Math.abs(Math.sin(record.rotationY))
  const sx = record.width * cos + 0.12 * sin
  const sz = record.width * sin + 0.12 * cos
  colliders.addAabb(colliderId, 'door', record.x, record.height / 2, record.z, sx, record.height, sz)
}

function buildCorridorConnectors(architecture: THREE.Object3D, colliders: ColliderWorld): void {
  // Thin side walls for the 0.5–1m vestibules so players don't fall into void visually
  // Printer vestibule at x=-7.25
  createColumn(architecture, colliders, -7.25, -1.1, 3.0)
  createColumn(architecture, colliders, -7.25, 1.1, 3.0)
  // Break vestibule
  createColumn(architecture, colliders, 7.25, -1.0, 3.0)
  createColumn(architecture, colliders, 7.25, 1.0, 3.0)
}
