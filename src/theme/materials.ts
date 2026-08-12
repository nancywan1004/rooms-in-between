import * as THREE from 'three'
import { PALETTE, type PaletteKey } from './palette'

const cache = new Map<string, THREE.MeshStandardMaterial>()

export type MaterialOpts = {
  roughness?: number
  metalness?: number
  transparent?: boolean
  opacity?: number
  emissive?: number
  emissiveIntensity?: number
  side?: THREE.Side
}

export function getMaterial(key: PaletteKey, opts: MaterialOpts = {}): THREE.MeshStandardMaterial {
  const {
    roughness = 0.72,
    metalness = 0.05,
    transparent = false,
    opacity = 1,
    emissive = 0x000000,
    emissiveIntensity = 0,
    side = THREE.FrontSide,
  } = opts

  const cacheKey = `${key}:${roughness}:${metalness}:${transparent}:${opacity}:${emissive}:${emissiveIntensity}:${side}`
  const hit = cache.get(cacheKey)
  if (hit) return hit

  const mat = new THREE.MeshStandardMaterial({
    color: PALETTE[key],
    roughness,
    metalness,
    transparent,
    opacity,
    emissive,
    emissiveIntensity,
    side,
  })
  cache.set(cacheKey, mat)
  return mat
}

export function glassMaterial(): THREE.MeshStandardMaterial {
  return getMaterial('MAT_GLASS', {
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
  })
}
