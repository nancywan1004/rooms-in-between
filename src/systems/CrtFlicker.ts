import * as THREE from 'three'
import { crtScreenMaterial } from '../theme/materials'

/** Subtle CRT flicker on the shared screen material (one update for all monitors) */
export class CrtFlicker {
  private time = 0
  private readonly base = 0.65

  collect(_root: THREE.Object3D): void {
    // Shared material — nothing to collect
    void _root
  }

  update(dt: number): void {
    this.time += dt
    const mat = crtScreenMaterial()
    const slow = Math.sin(this.time * 1.7) * 0.04
    const twitch = Math.sin(this.time * 23) > 0.94 ? -0.22 : 0
    mat.emissiveIntensity = Math.max(0.2, this.base + slow + twitch)
  }
}
