import * as THREE from 'three'
import { PALETTE, type PaletteKey } from './palette'
import {
  beigePlasticTexture,
  brushedMetalTexture,
  carpetTexture,
  ceilingTileTexture,
  crtScreenTexture,
  deskLaminateTexture,
  deskRoughnessTexture,
  wallPaintTexture,
} from './textures'

const cache = new Map<string, THREE.MeshStandardMaterial>()

/** Shared textured materials — created once */
let deskMat: THREE.MeshStandardMaterial | null = null
let plasticMat: THREE.MeshStandardMaterial | null = null
let metalMat: THREE.MeshStandardMaterial | null = null
let glassMat: THREE.MeshStandardMaterial | null = null
let carpetMat: THREE.MeshStandardMaterial | null = null
let ceilingMat: THREE.MeshStandardMaterial | null = null
let wallMat: THREE.MeshStandardMaterial | null = null
let crtScreenMat: THREE.MeshStandardMaterial | null = null

export type MaterialOpts = {
  roughness?: number
  metalness?: number
  transparent?: boolean
  opacity?: number
  emissive?: number
  emissiveIntensity?: number
  side?: THREE.Side
  map?: THREE.Texture | null
  color?: number
}

export function getMaterial(key: PaletteKey, opts: MaterialOpts = {}): THREE.MeshStandardMaterial {
  const {
    roughness = 0.78,
    metalness = 0.04,
    transparent = false,
    opacity = 1,
    emissive = 0x000000,
    emissiveIntensity = 0,
    side = THREE.FrontSide,
    map = null,
    color,
  } = opts

  const mapId = map ? map.uuid : 'none'
  const cacheKey = `${key}:${roughness}:${metalness}:${transparent}:${opacity}:${emissive}:${emissiveIntensity}:${side}:${mapId}:${color ?? ''}`
  const hit = cache.get(cacheKey)
  if (hit) return hit

  const mat = new THREE.MeshStandardMaterial({
    color: color ?? PALETTE[key],
    roughness,
    metalness,
    transparent,
    opacity,
    emissive,
    emissiveIntensity,
    side,
    map: map ?? undefined,
  })
  cache.set(cacheKey, mat)
  return mat
}

export function glassMaterial(): THREE.MeshStandardMaterial {
  if (!glassMat) {
    glassMat = getMaterial('MAT_GLASS', {
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    })
  }
  return glassMat
}

export function carpetMaterial(_repeatX = 6, _repeatY = 6): THREE.MeshStandardMaterial {
  void _repeatX
  void _repeatY
  if (!carpetMat) {
    const map = carpetTexture().clone()
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(8, 8)
    map.needsUpdate = true
    carpetMat = new THREE.MeshStandardMaterial({
      color: 0xd0ccc4,
      map,
      roughness: 0.97,
      metalness: 0,
    })
  }
  return carpetMat
}

export function ceilingMaterial(_repeatX = 4, _repeatY = 4): THREE.MeshStandardMaterial {
  void _repeatX
  void _repeatY
  if (!ceilingMat) {
    const map = ceilingTileTexture().clone()
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(6, 6)
    map.needsUpdate = true
    ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xe8e4dc,
      map,
      roughness: 0.94,
      metalness: 0,
      side: THREE.DoubleSide,
    })
  }
  return ceilingMat
}

export function wallMaterial(_repeatX = 2, _repeatY = 1): THREE.MeshStandardMaterial {
  void _repeatX
  void _repeatY
  if (!wallMat) {
    const map = wallPaintTexture().clone()
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(3, 1.5)
    map.needsUpdate = true
    wallMat = new THREE.MeshStandardMaterial({
      color: 0xf0ebe4,
      map,
      roughness: 0.9,
      metalness: 0,
    })
  }
  return wallMat
}

export function deskMaterial(_repeatX = 2, _repeatY = 1): THREE.MeshStandardMaterial {
  void _repeatX
  void _repeatY
  if (!deskMat) {
    const map = deskLaminateTexture().clone()
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(2, 1)
    map.needsUpdate = true
    const rough = deskRoughnessTexture().clone()
    rough.wrapS = rough.wrapT = THREE.RepeatWrapping
    rough.repeat.set(2, 1)
    rough.needsUpdate = true
    deskMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      roughnessMap: rough,
      roughness: 0.72,
      metalness: 0.02,
    })
  }
  return deskMat
}

export function plasticMaterial(): THREE.MeshStandardMaterial {
  if (!plasticMat) {
    const map = beigePlasticTexture().clone()
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(2, 2)
    map.needsUpdate = true
    plasticMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      roughness: 0.48,
      metalness: 0.05,
    })
  }
  return plasticMat
}

export function metalMaterial(): THREE.MeshStandardMaterial {
  if (!metalMat) {
    const map = brushedMetalTexture().clone()
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(1, 2)
    map.needsUpdate = true
    metalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      roughness: 0.38,
      metalness: 0.55,
    })
  }
  return metalMat
}

/** Shared CRT screen — flicker updates this one material for all monitors */
export function crtScreenMaterial(): THREE.MeshStandardMaterial {
  if (!crtScreenMat) {
    crtScreenMat = new THREE.MeshStandardMaterial({
      map: crtScreenTexture(),
      emissive: 0x1a4030,
      emissiveIntensity: 0.65,
      roughness: 0.35,
    })
  }
  return crtScreenMat
}
