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
        // Quiet Dread — cool fluorescent, stale air
        this.scene.background = new THREE.Color(0x8a8e92)
        this.scene.fog = new THREE.FogExp2(0x8a8e92, 0.028)
        this.hemi.color.setHex(0xd8dde2)
        this.hemi.groundColor.setHex(0x6a6864)
        this.hemi.intensity = 0.32
        this.dir.intensity = 0.35
        this.dir.color.setHex(0xe4eaf0)
        break
      case 'STRANGE':
        this.scene.background = new THREE.Color(0x6e7278)
        this.scene.fog = new THREE.FogExp2(0x6e7278, 0.034)
        this.hemi.intensity = 0.22
        this.dir.intensity = 0.25
        this.dir.color.setHex(0xc0c8d4)
        break
      case 'PRESSURE':
        this.scene.background = new THREE.Color(0x5a5654)
        this.scene.fog = new THREE.FogExp2(0x5a5654, 0.04)
        this.hemi.intensity = 0.18
        this.dir.intensity = 0.2
        break
      case 'BOSS':
        this.scene.background = new THREE.Color(0x4a5058)
        this.scene.fog = new THREE.FogExp2(0x4a5058, 0.03)
        this.hemi.intensity = 0.2
        this.dir.color.setHex(PALETTE.MAT_DUSTY_BLUE)
        break
      case 'FREEDOM':
        this.scene.background = new THREE.Color(0xc8b8a8)
        this.scene.fog = new THREE.FogExp2(0xc8b8a8, 0.015)
        this.hemi.intensity = 0.55
        this.dir.intensity = 0.7
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
