import * as THREE from 'three'
import { PALETTE, type PaletteKey } from './palette'
import { carpetTexture, ceilingTileTexture, wallPaintTexture } from './textures'

const cache = new Map<string, THREE.MeshStandardMaterial>()

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
  return getMaterial('MAT_GLASS', {
    roughness: 0.12,
    metalness: 0.15,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
  })
}

export function carpetMaterial(repeatX = 6, repeatY = 6): THREE.MeshStandardMaterial {
  const map = carpetTexture().clone()
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.set(repeatX, repeatY)
  map.needsUpdate = true
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughness: 0.95,
    metalness: 0,
  })
}

export function ceilingMaterial(repeatX = 4, repeatY = 4): THREE.MeshStandardMaterial {
  const map = ceilingTileTexture().clone()
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.set(repeatX, repeatY)
  map.needsUpdate = true
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  })
}

export function wallMaterial(repeatX = 2, repeatY = 1): THREE.MeshStandardMaterial {
  const map = wallPaintTexture().clone()
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.set(repeatX, repeatY)
  map.needsUpdate = true
  // Unique per call so UV repeats can differ — don't share via getMaterial cache blindly
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughness: 0.88,
    metalness: 0,
  })
}
