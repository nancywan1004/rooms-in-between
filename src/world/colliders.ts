import * as THREE from 'three'

export type ColliderBox = {
  id: string
  min: THREE.Vector3
  max: THREE.Vector3
  kind: 'wall' | 'desk' | 'door' | 'furniture' | 'cabinet' | 'printer'
}

export class ColliderWorld {
  private boxes: ColliderBox[] = []

  clear(): void {
    this.boxes = []
  }

  add(box: ColliderBox): void {
    this.boxes.push(box)
  }

  addAabb(
    id: string,
    kind: ColliderBox['kind'],
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
    this.add({
      id,
      kind,
      min: new THREE.Vector3(cx - hx, cy - hy, cz - hz),
      max: new THREE.Vector3(cx + hx, cy + hy, cz + hz),
    })
  }

  /** Axis-aligned box from world transform (unrotated). */
  addMeshBox(id: string, kind: ColliderBox['kind'], mesh: THREE.Object3D, padding = 0): void {
    const box = new THREE.Box3().setFromObject(mesh)
    if (padding) {
      box.min.addScalar(-padding)
      box.max.addScalar(padding)
    }
    this.add({ id, kind, min: box.min.clone(), max: box.max.clone() })
  }

  removeById(id: string): void {
    this.boxes = this.boxes.filter((b) => b.id !== id)
  }

  getAll(): readonly ColliderBox[] {
    return this.boxes
  }

  /**
   * Resolve horizontal capsule (circle in XZ) against AABBs.
   * Returns corrected position.
   */
  resolveCircle(
    x: number,
    z: number,
    radius: number,
    yMin: number,
    yMax: number,
  ): { x: number; z: number } {
    let px = x
    let pz = z

    for (const b of this.boxes) {
      // Skip if vertically disjoint
      if (yMax < b.min.y || yMin > b.max.y) continue

      const closestX = Math.max(b.min.x, Math.min(px, b.max.x))
      const closestZ = Math.max(b.min.z, Math.min(pz, b.max.z))
      let dx = px - closestX
      let dz = pz - closestZ
      const distSq = dx * dx + dz * dz

      if (distSq >= radius * radius) continue

      if (distSq === 0) {
        // Center inside box — push out along shallowest axis
        const left = Math.abs(px - b.min.x)
        const right = Math.abs(b.max.x - px)
        const near = Math.abs(pz - b.min.z)
        const far = Math.abs(b.max.z - pz)
        const m = Math.min(left, right, near, far)
        if (m === left) px = b.min.x - radius
        else if (m === right) px = b.max.x + radius
        else if (m === near) pz = b.min.z - radius
        else pz = b.max.z + radius
        continue
      }

      const dist = Math.sqrt(distSq)
      const push = (radius - dist) / dist
      px += dx * push
      pz += dz * push
    }

    return { x: px, z: pz }
  }
}
