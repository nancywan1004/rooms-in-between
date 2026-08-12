export type DoorId =
  | 'door_printer'
  | 'door_break'
  | 'door_manager'
  | 'door_meeting'
  | 'door_elevator'

export type DoorState = 'locked' | 'unlocked' | 'open' | 'closed' | 'disabled'

export type DoorRecord = {
  id: DoorId
  state: DoorState
  /** World position for interaction & mesh sync */
  x: number
  y: number
  z: number
  /** Opening width along local X when facing +Z */
  width: number
  height: number
  /** Yaw in radians: door faces this direction when closed */
  rotationY: number
  accent: 'printer' | 'break' | 'manager' | 'meeting' | 'elevator'
}

const INTERACT_RANGE = 2.2

export class DoorRegistry {
  private doors = new Map<DoorId, DoorRecord>()
  private listeners = new Set<(door: DoorRecord) => void>()

  register(door: DoorRecord): void {
    this.doors.set(door.id, { ...door })
  }

  get(id: DoorId): DoorRecord | undefined {
    return this.doors.get(id)
  }

  all(): DoorRecord[] {
    return [...this.doors.values()]
  }

  setState(id: DoorId, state: DoorState): void {
    const d = this.doors.get(id)
    if (!d) return
    d.state = state
    this.listeners.forEach((fn) => fn(d))
  }

  onChange(fn: (door: DoorRecord) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  findNearest(px: number, pz: number, range = INTERACT_RANGE): DoorRecord | null {
    let best: DoorRecord | null = null
    let bestDist = range
    for (const d of this.doors.values()) {
      const dist = Math.hypot(d.x - px, d.z - pz)
      if (dist < bestDist) {
        bestDist = dist
        best = d
      }
    }
    return best
  }

  tryInteract(px: number, pz: number): { ok: boolean; message: string; door?: DoorRecord } {
    const door = this.findNearest(px, pz)
    if (!door) return { ok: false, message: '' }

    if (door.state === 'locked' || door.state === 'disabled') {
      if (door.id === 'door_elevator') {
        return {
          ok: false,
          message: 'ACCESS DENIED — OUTSTANDING TASKS: 3',
          door,
        }
      }
      return { ok: false, message: `${door.id} is locked`, door }
    }

    if (door.state === 'closed' || door.state === 'unlocked') {
      this.setState(door.id, 'open')
      return { ok: true, message: '', door }
    }

    if (door.state === 'open') {
      this.setState(door.id, 'closed')
      return { ok: true, message: '', door }
    }

    return { ok: false, message: '', door }
  }
}
