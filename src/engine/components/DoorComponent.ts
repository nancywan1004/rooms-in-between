import { Component } from '../Component'
import { asNumber, asString } from '../ids'
import { createDoorVisual, syncDoorVisual, type DoorVisual } from '../../world/architecture'
import type { DoorState } from '../../world/doors'
import type { ColliderWorld } from '../../world/colliders'
import { CollisionComponent } from './CollisionComponent'

export type DoorAccent = 'printer' | 'break' | 'manager' | 'meeting' | 'elevator'

export class DoorComponent extends Component {
  static readonly typeId = 'Door'

  doorId = 'door'
  state: DoorState = 'closed'
  width = 1.1
  height = 2.2
  accent: DoorAccent = 'printer'

  private visual: DoorVisual | null = null

  rebuildVisual(): void {
    this.clearVisual()
    const record = {
      id: this.doorId as never,
      state: this.state,
      x: 0,
      y: 0,
      z: 0,
      width: this.width,
      height: this.height,
      rotationY: 0,
      accent: this.accent,
    }
    this.visual = createDoorVisual(this.gameObject.node, record)
    syncDoorVisual(this.visual, this.state)
  }

  private clearVisual(): void {
    if (!this.visual) return
    this.visual.group.removeFromParent()
    this.visual = null
  }

  interact(): { ok: boolean; message: string } {
    if (this.state === 'locked' || this.state === 'disabled') {
      if (this.doorId === 'door_elevator') {
        return { ok: false, message: 'ACCESS DENIED — OUTSTANDING TASKS: 3' }
      }
      return { ok: false, message: `${this.doorId} is locked` }
    }
    if (this.state === 'closed' || this.state === 'unlocked') {
      this.setState('open')
      return { ok: true, message: '' }
    }
    if (this.state === 'open') {
      this.setState('closed')
      return { ok: true, message: '' }
    }
    return { ok: false, message: '' }
  }

  setState(state: DoorState): void {
    this.state = state
    if (this.visual) syncDoorVisual(this.visual, state)
  }

  syncCollider(colliders: ColliderWorld): void {
    const col = this.gameObject.getComponent(CollisionComponent)
    if (!col) return
    col.enabled = this.enabled && this.state !== 'open'
    col.syncToWorld(colliders)
  }

  override onDestroy(): void {
    this.clearVisual()
  }

  serialize(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      doorId: this.doorId,
      state: this.state,
      width: this.width,
      height: this.height,
      accent: this.accent,
    }
  }

  deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    this.doorId = asString(data.doorId, 'door')
    this.state = (asString(data.state, 'closed') as DoorState) || 'closed'
    this.width = asNumber(data.width, 1.1)
    this.height = asNumber(data.height, 2.2)
    const accent = asString(data.accent, 'printer') as DoorAccent
    this.accent = accent
  }
}
