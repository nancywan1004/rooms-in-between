import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { deskMaterial, getMaterial, metalMaterial, plasticMaterial } from '../theme/materials'

type BatchBucket = {
  material: THREE.Material
  geos: THREE.BufferGeometry[]
}

/** Merge same-material static meshes into one draw call each */
export class MeshBatcher {
  private buckets = new Map<string, BatchBucket>()

  addBox(
    key: string,
    material: THREE.Material,
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
    rotationY = 0,
    rounded = false,
  ): void {
    const geo = rounded
      ? new RoundedBoxGeometry(sx, sy, sz, 1, 0.01)
      : new THREE.BoxGeometry(sx, sy, sz)
    const m = new THREE.Matrix4()
    m.makeRotationY(rotationY)
    m.setPosition(cx, cy, cz)
    geo.applyMatrix4(m)

    let bucket = this.buckets.get(key)
    if (!bucket) {
      bucket = { material, geos: [] }
      this.buckets.set(key, bucket)
    }
    bucket.geos.push(geo)
  }

  flush(parent: THREE.Object3D, opts?: { castShadow?: boolean; receiveShadow?: boolean }): void {
    const castShadow = opts?.castShadow ?? true
    const receiveShadow = opts?.receiveShadow ?? true
    for (const [, bucket] of this.buckets) {
      if (bucket.geos.length === 0) continue
      try {
        const merged = mergeParts(bucket.geos)
        const mesh = new THREE.Mesh(merged, bucket.material)
        mesh.castShadow = castShadow
        mesh.receiveShadow = receiveShadow
        mesh.frustumCulled = true
        parent.add(mesh)
      } catch (err) {
        console.warn('[MeshBatcher] merge failed, falling back to individuals', err)
        // Fallback: keep scene visible even if merge fails
        for (const geo of bucket.geos) {
          const mesh = new THREE.Mesh(geo, bucket.material)
          mesh.castShadow = castShadow
          mesh.receiveShadow = receiveShadow
          parent.add(mesh)
        }
      }
    }
    this.buckets.clear()
  }
}

export type Pose = { x: number; y: number; z: number; rotationY: number }

function setInstancePose(
  mesh: THREE.InstancedMesh,
  index: number,
  pose: Pose,
  dummy: THREE.Object3D,
): void {
  dummy.position.set(pose.x, pose.y, pose.z)
  dummy.rotation.set(0, pose.rotationY, 0)
  dummy.scale.set(1, 1, 1)
  dummy.updateMatrix()
  mesh.setMatrixAt(index, dummy.matrix)
}

/** Normalize parts so mergeGeometries never chokes on index/groups mismatch */
function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const prepared = parts.map((geo) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    g.clearGroups()
    // Drop morph/extra attrs — keep position/normal/uv only
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') {
        g.deleteAttribute(name)
      }
    }
    if (!g.getAttribute('normal')) g.computeVertexNormals()
    if (!g.getAttribute('uv')) {
      // minimal uv so all geos share the same attribute set
      const count = g.getAttribute('position').count
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2))
    }
    return g
  })
  const merged = mergeGeometries(prepared, false)
  if (!merged) {
    for (const p of prepared) p.dispose()
    throw new Error('geometry merge failed')
  }
  for (const p of parts) p.dispose()
  for (const p of prepared) {
    if (p !== merged) p.dispose()
  }
  return merged
}

/** Build a single-draw chair geometry (seat + back + stem + base) */
export function buildChairGeometry(): THREE.BufferGeometry {
  const seat = new THREE.BoxGeometry(0.48, 0.07, 0.48)
  seat.translate(0, 0.45, 0)

  const back = new THREE.BoxGeometry(0.46, 0.48, 0.07)
  back.translate(0, 0.72, -0.22)

  const stem = new THREE.BoxGeometry(0.05, 0.38, 0.05)
  stem.translate(0, 0.24, 0)

  const base = new THREE.BoxGeometry(0.4, 0.05, 0.4)
  base.translate(0, 0.04, 0)

  return mergeParts([seat, back, stem, base])
}

export function createChairInstances(parent: THREE.Object3D, poses: Pose[]): THREE.InstancedMesh | null {
  if (poses.length === 0) return null
  const geo = buildChairGeometry()
  const mesh = new THREE.InstancedMesh(geo, getMaterial('MAT_CHAIR', { roughness: 0.75 }), poses.length)
  mesh.castShadow = true
  mesh.frustumCulled = true
  const dummy = new THREE.Object3D()
  poses.forEach((p, i) => setInstancePose(mesh, i, p, dummy))
  mesh.instanceMatrix.needsUpdate = true
  parent.add(mesh)
  return mesh
}

/** Ceiling panel geometry helper (unused — panels use separate InstancedMeshes) */
export function buildCeilingPanelGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(1.4, 0.06, 1.4)
}

export function createCeilingPanelInstances(
  parent: THREE.Object3D,
  poses: Pose[],
  color = 0xe8eef2,
): void {
  if (poses.length === 0) return
  const dummy = new THREE.Object3D()

  const housing = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.4, 0.06, 1.4),
    getMaterial('MAT_STEEL', { roughness: 0.45, metalness: 0.35 }),
    poses.length,
  )
  housing.castShadow = false
  poses.forEach((p, i) => {
    setInstancePose(housing, i, { ...p, y: p.y - 0.015 }, dummy)
  })
  housing.instanceMatrix.needsUpdate = true
  parent.add(housing)

  const diffuserGeo = new THREE.PlaneGeometry(1.22, 1.22)
  diffuserGeo.rotateX(Math.PI / 2)
  const diffuser = new THREE.InstancedMesh(
    diffuserGeo,
    getMaterial('MAT_WARM_WHITE', {
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 1.05,
      side: THREE.DoubleSide,
    }),
    poses.length,
  )
  poses.forEach((p, i) => {
    setInstancePose(diffuser, i, { ...p, y: p.y - 0.05 }, dummy)
  })
  diffuser.instanceMatrix.needsUpdate = true
  parent.add(diffuser)
}

/** Simplified desk unit for instancing (top + pedestal + legs) */
export function buildDeskGeometry(): THREE.BufferGeometry {
  const top = new THREE.BoxGeometry(1.4, 0.04, 0.7)
  top.translate(0, 0.72, 0)

  const pedestal = new THREE.BoxGeometry(0.4, 0.65, 0.62)
  pedestal.translate(-0.45, 0.325, 0)

  const leg1 = new THREE.BoxGeometry(0.045, 0.68, 0.045)
  leg1.translate(0.6, 0.34, 0.28)
  const leg2 = new THREE.BoxGeometry(0.045, 0.68, 0.045)
  leg2.translate(0.6, 0.34, -0.28)

  const modesty = new THREE.BoxGeometry(0.9, 0.35, 0.02)
  modesty.translate(0.15, 0.35, -0.28)

  return mergeParts([top, pedestal, leg1, leg2, modesty])
}

export function buildCrtGeometry(): THREE.BufferGeometry {
  const bezel = new THREE.BoxGeometry(0.42, 0.36, 0.38)
  bezel.translate(0.05, 0.98, -0.12)
  const stand = new THREE.BoxGeometry(0.24, 0.05, 0.2)
  stand.translate(0.05, 0.76, -0.12)
  return mergeParts([bezel, stand])
}

export function createDeskInstances(
  parent: THREE.Object3D,
  poses: Pose[],
): { desks: THREE.InstancedMesh; crts: THREE.InstancedMesh } | null {
  if (poses.length === 0) return null
  const dummy = new THREE.Object3D()

  // Desk body uses laminate look via deskMaterial (single material for whole merged geo — approx)
  const desks = new THREE.InstancedMesh(buildDeskGeometry(), deskMaterial(), poses.length)
  desks.castShadow = true
  desks.receiveShadow = true
  poses.forEach((p, i) => setInstancePose(desks, i, p, dummy))
  desks.instanceMatrix.needsUpdate = true
  parent.add(desks)

  const crts = new THREE.InstancedMesh(buildCrtGeometry(), plasticMaterial(), poses.length)
  crts.castShadow = true
  poses.forEach((p, i) => setInstancePose(crts, i, p, dummy))
  crts.instanceMatrix.needsUpdate = true
  parent.add(crts)

  // Shared keyboard strip
  const kb = new THREE.InstancedMesh(
    new RoundedBoxGeometry(0.42, 0.028, 0.15, 1, 0.006),
    plasticMaterial(),
    poses.length,
  )
  poses.forEach((p, i) => {
    dummy.position.set(p.x, 0, p.z)
    dummy.rotation.set(0, p.rotationY, 0)
    dummy.updateMatrix()
    const local = new THREE.Matrix4().makeTranslation(0.05, 0.745, 0.18)
    dummy.matrix.multiply(local)
    kb.setMatrixAt(i, dummy.matrix)
  })
  kb.instanceMatrix.needsUpdate = true
  parent.add(kb)

  void metalMaterial
  return { desks, crts }
}

/** Module-level batch session used while rooms are built */
let wallBatcher: MeshBatcher | null = null
const chairPoses: Pose[] = []
const panelPoses: Pose[] = []
const deskPoses: Pose[] = []

export function beginWorldBatch(): void {
  wallBatcher = new MeshBatcher()
  chairPoses.length = 0
  panelPoses.length = 0
  deskPoses.length = 0
}

export function getWallBatcher(): MeshBatcher | null {
  return wallBatcher
}

export function queueChair(x: number, z: number, rotationY: number): void {
  chairPoses.push({ x, y: 0, z, rotationY })
}

export function queueCeilingPanel(x: number, y: number, z: number): void {
  panelPoses.push({ x, y, z, rotationY: 0 })
}

export function queueDesk(x: number, z: number, rotationY: number): void {
  deskPoses.push({ x, y: 0, z, rotationY })
}

export function flushWorldBatch(parent: THREE.Object3D): void {
  if (wallBatcher) {
    wallBatcher.flush(parent)
    wallBatcher = null
  }
  createChairInstances(parent, chairPoses)
  createCeilingPanelInstances(parent, panelPoses)
  createDeskInstances(parent, deskPoses)
  chairPoses.length = 0
  panelPoses.length = 0
  deskPoses.length = 0
}
