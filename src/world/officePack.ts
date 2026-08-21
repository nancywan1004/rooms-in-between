import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { crtScreenMaterial, getMaterial } from '../theme/materials'

const BASE = '/assets/office_pack/gLTF'

export type OfficePackId =
  | 'desk_big'
  | 'desk_corner'
  | 'lamp_architect'
  | 'monitor'
  | 'monitor_ultrawide'
  | 'printer_big'
  | 'keyboard'
  | 'wireless_mouse'
  | 'mug'
  | 'pencil_holder'
  | 'office_chair'
  | 'pen'

const PRELOAD: OfficePackId[] = [
  'desk_big',
  'desk_corner',
  'lamp_architect',
  'monitor',
  'monitor_ultrawide',
  'printer_big',
  'keyboard',
  'wireless_mouse',
  'mug',
  'pencil_holder',
  'office_chair',
  'pen',
]

const templates = new Map<OfficePackId, THREE.Object3D>()
let preloadPromise: Promise<void> | null = null

const _box = new THREE.Box3()
const _size = new THREE.Vector3()

export function isOfficePackReady(): boolean {
  return templates.size >= PRELOAD.length
}

export function preloadOfficePack(): Promise<void> {
  if (isOfficePackReady()) return Promise.resolve()
  if (preloadPromise) return preloadPromise

  const loader = new GLTFLoader()
  preloadPromise = Promise.all(
    PRELOAD.map(
      (id) =>
        new Promise<void>((resolve) => {
          loader.load(
            `${BASE}/${id}.glb`,
            (gltf) => {
              const root = gltf.scene
              root.traverse((obj) => {
                obj.castShadow = true
                obj.receiveShadow = true
                if (obj instanceof THREE.Mesh) {
                  prepareMesh(obj, id)
                }
              })
              templates.set(id, root)
              resolve()
            },
            undefined,
            (err) => {
              console.warn(`[officePack] failed to load ${id}`, err)
              resolve()
            },
          )
        }),
    ),
  ).then(() => undefined)

  return preloadPromise
}

function prepareMesh(mesh: THREE.Mesh, id: OfficePackId): void {
  const name = mesh.name.toLowerCase()
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  const looksLikeScreen =
    id.startsWith('monitor') &&
    (name.includes('screen') ||
      name.includes('display') ||
      mats.some((m) => {
        if (!(m instanceof THREE.MeshStandardMaterial) && !(m instanceof THREE.MeshPhysicalMaterial)) return false
        const c = m.color
        return c.r + c.g + c.b < 0.45 || m.emissiveIntensity > 0.05
      }))

  if (looksLikeScreen) {
    mesh.material = crtScreenMaterial()
    mesh.userData.isCrt = true
    mesh.userData.baseEmissive = 0.65
    return
  }

  // Flatten to palette-adjacent solids so pack textures don't fight Quiet Dread.
  for (let i = 0; i < mats.length; i++) {
    const m = mats[i]
    if (!(m instanceof THREE.MeshStandardMaterial) && !(m instanceof THREE.MeshPhysicalMaterial)) continue
    const lum = (m.color.r + m.color.g + m.color.b) / 3
    let key: 'MAT_DESK' | 'MAT_CHARCOAL' | 'MAT_STEEL' | 'MAT_CREAM' | 'MAT_PAPER' | 'MAT_BEIGE_TECH' = 'MAT_BEIGE_TECH'
    if (lum < 0.25) key = 'MAT_CHARCOAL'
    else if (lum < 0.45) key = 'MAT_STEEL'
    else if (lum > 0.75) key = 'MAT_PAPER'
    else if (id.startsWith('desk')) key = 'MAT_DESK'
    else if (id === 'mug' || id === 'pencil_holder') key = 'MAT_CREAM'
    mats[i] = getMaterial(key, {
      roughness: m.roughness ?? 0.7,
      metalness: Math.min(0.25, m.metalness ?? 0),
    })
  }
  mesh.material = Array.isArray(mesh.material) ? mats : mats[0]!
}

export type FitOpts = {
  /** Axis-aligned target size in local space after optional yaw. */
  target?: [number, number, number]
  /** Extra yaw applied before fitting (radians). */
  yaw?: number
  /** Lift so minY sits on y=0 (default true). */
  floor?: boolean
  /** Recolor/CRT already applied on template; clones share materials. */
}

/** Clone a preloaded asset. Returns null if not ready. */
export function cloneOfficeAsset(id: OfficePackId, opts: FitOpts = {}): THREE.Group | null {
  const tpl = templates.get(id)
  if (!tpl) return null
  const g = new THREE.Group()
  g.name = `office_${id}`
  const clone = tpl.clone(true)
  if (opts.yaw) clone.rotation.y = opts.yaw
  g.add(clone)

  if (opts.target) fitInto(g, opts.target)
  if (opts.floor !== false) seatOnFloor(g)
  return g
}

function fitInto(root: THREE.Object3D, target: [number, number, number]): void {
  root.updateMatrixWorld(true)
  _box.setFromObject(root)
  _box.getSize(_size)
  if (_size.x < 1e-4 || _size.y < 1e-4 || _size.z < 1e-4) return
  root.scale.multiply(
    new THREE.Vector3(target[0] / _size.x, target[1] / _size.y, target[2] / _size.z),
  )
}

function seatOnFloor(root: THREE.Object3D): void {
  root.updateMatrixWorld(true)
  _box.setFromObject(root)
  root.position.y -= _box.min.y
}

export function deskSurfaceY(deskRoot: THREE.Object3D): number {
  deskRoot.updateMatrixWorld(true)
  _box.setFromObject(deskRoot)
  return _box.max.y
}
