import * as THREE from 'three'

export type TriggerId =
  | 'trigger_spawn'
  | 'trigger_rule1_start'
  | 'trigger_rule1_complete'
  | 'trigger_manager_spawn_01'
  | 'trigger_rule2_start'
  | 'trigger_rule2_complete'
  | 'trigger_manager_spawn_02'
  | 'trigger_rule3_start'
  | 'trigger_boss_start'
  | 'trigger_boss_phase_02'
  | 'trigger_boss_phase_03'
  | 'trigger_ending'

export type TriggerZone = {
  id: TriggerId
  min: THREE.Vector3
  max: THREE.Vector3
}

export class TriggerRegistry {
  private zones: TriggerZone[] = []
  private inside = new Set<TriggerId>()

  clear(): void {
    this.zones = []
    this.inside.clear()
  }

  addBox(
    id: TriggerId,
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
  ): void {
    const hx = sx / 2
    const hy = sy / 2
    const hz = sz / 2
    this.zones.push({
      id,
      min: new THREE.Vector3(cx - hx, cy - hy, cz - hz),
      max: new THREE.Vector3(cx + hx, cy + hy, cz + hz),
    })
  }

  /** Returns newly entered trigger ids this frame. */
  update(px: number, py: number, pz: number): TriggerId[] {
    const entered: TriggerId[] = []
    const now = new Set<TriggerId>()

    for (const z of this.zones) {
      const hit =
        px >= z.min.x &&
        px <= z.max.x &&
        py >= z.min.y &&
        py <= z.max.y &&
        pz >= z.min.z &&
        pz <= z.max.z
      if (!hit) continue
      now.add(z.id)
      if (!this.inside.has(z.id)) entered.push(z.id)
    }

    this.inside = now
    return entered
  }

  getZones(): readonly TriggerZone[] {
    return this.zones
  }
}
