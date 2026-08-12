import * as THREE from 'three'
import { PALETTE } from '../theme/palette'

export type OfficeVisualState = 'ORDER' | 'STRANGE' | 'PRESSURE' | 'BOSS' | 'FREEDOM'

export class OfficeStateController {
  private state: OfficeVisualState = 'ORDER'
  private scene: THREE.Scene | null = null
  private hemi: THREE.HemisphereLight | null = null
  private dir: THREE.DirectionalLight | null = null

  bind(scene: THREE.Scene, hemi: THREE.HemisphereLight, dir: THREE.DirectionalLight): void {
    this.scene = scene
    this.hemi = hemi
    this.dir = dir
    this.apply('ORDER')
  }

  get current(): OfficeVisualState {
    return this.state
  }

  setOfficeState(next: OfficeVisualState): void {
    if (this.state === next) return
    this.state = next
    this.apply(next)
    console.log(`[OfficeState] → ${next}`)
  }

  private apply(state: OfficeVisualState): void {
    if (!this.scene || !this.hemi || !this.dir) return

    switch (state) {
      case 'ORDER':
        this.scene.background = new THREE.Color(0xd8d0c4)
        this.scene.fog = new THREE.FogExp2(0xd8d0c4, 0.018)
        this.hemi.color.setHex(0xf5efe6)
        this.hemi.groundColor.setHex(0xc8bfb2)
        this.hemi.intensity = 0.55
        this.dir.intensity = 0.85
        this.dir.color.setHex(0xfff6ea)
        break
      case 'STRANGE':
        // Hook only — full treatment later
        this.scene.background = new THREE.Color(0xb8b4bc)
        this.scene.fog = new THREE.FogExp2(0xb8b4bc, 0.022)
        this.hemi.intensity = 0.4
        this.dir.intensity = 0.55
        this.dir.color.setHex(0xd0d4e0)
        break
      case 'PRESSURE':
        this.scene.background = new THREE.Color(0xa09890)
        this.scene.fog = new THREE.FogExp2(0xa09890, 0.028)
        this.hemi.intensity = 0.35
        this.dir.intensity = 0.5
        break
      case 'BOSS':
        this.scene.background = new THREE.Color(0x8a9098)
        this.scene.fog = new THREE.FogExp2(0x8a9098, 0.02)
        this.hemi.intensity = 0.3
        this.dir.color.setHex(PALETTE.MAT_DUSTY_BLUE)
        break
      case 'FREEDOM':
        this.scene.background = new THREE.Color(0xe8ddd0)
        this.scene.fog = new THREE.FogExp2(0xe8ddd0, 0.012)
        this.hemi.intensity = 0.7
        this.dir.intensity = 1.0
        this.dir.color.setHex(0xfff0e0)
        break
    }
  }
}

/** Module-level accessor set by Game */
let officeStateApi: OfficeStateController | null = null

export function bindOfficeStateApi(ctrl: OfficeStateController): void {
  officeStateApi = ctrl
}

export function setOfficeState(state: OfficeVisualState): void {
  officeStateApi?.setOfficeState(state)
}
