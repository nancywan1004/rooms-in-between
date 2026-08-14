import * as THREE from 'three'
import { PALETTE } from '../theme/palette'

export type OfficeVisualState = 'ORDER' | 'STRANGE' | 'PRESSURE' | 'BOSS' | 'FREEDOM'

type MoodListener = (state: OfficeVisualState) => void

export class OfficeStateController {
  private state: OfficeVisualState = 'ORDER'
  private scene: THREE.Scene | null = null
  private hemi: THREE.HemisphereLight | null = null
  private dir: THREE.DirectionalLight | null = null
  private listeners = new Set<MoodListener>()

  bind(scene: THREE.Scene, hemi: THREE.HemisphereLight, dir: THREE.DirectionalLight): void {
    this.scene = scene
    this.hemi = hemi
    this.dir = dir
    this.apply('ORDER')
  }

  onMood(fn: MoodListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  get current(): OfficeVisualState {
    return this.state
  }

  setOfficeState(next: OfficeVisualState): void {
    if (this.state === next) return
    this.state = next
    this.apply(next)
    this.listeners.forEach((fn) => fn(next))
    console.log(`[OfficeState] → ${next}`)
  }

  private apply(state: OfficeVisualState): void {
    if (!this.scene || !this.hemi || !this.dir) return

    switch (state) {
      case 'ORDER':
        // Readable Quiet Dread — not pitch black
        this.scene.background = new THREE.Color(0x8a9098)
        this.scene.fog = new THREE.FogExp2(0x8a9098, 0.022)
        this.hemi.color.setHex(0xe8eef4)
        this.hemi.groundColor.setHex(0x5a5854)
        this.hemi.intensity = 0.55
        this.dir.intensity = 0.65
        this.dir.color.setHex(0xf0f4f8)
        break
      case 'STRANGE':
        this.scene.background = new THREE.Color(0x6e747c)
        this.scene.fog = new THREE.FogExp2(0x6e747c, 0.028)
        this.hemi.intensity = 0.4
        this.dir.intensity = 0.45
        this.dir.color.setHex(0xc0c8d4)
        break
      case 'PRESSURE':
        this.scene.background = new THREE.Color(0x5a5654)
        this.scene.fog = new THREE.FogExp2(0x5a5654, 0.032)
        this.hemi.intensity = 0.35
        this.dir.intensity = 0.4
        break
      case 'BOSS':
        this.scene.background = new THREE.Color(0x4a5058)
        this.scene.fog = new THREE.FogExp2(0x4a5058, 0.026)
        this.hemi.intensity = 0.35
        this.dir.color.setHex(PALETTE.MAT_DUSTY_BLUE)
        break
      case 'FREEDOM':
        this.scene.background = new THREE.Color(0xb8a898)
        this.scene.fog = new THREE.FogExp2(0xb8a898, 0.015)
        this.hemi.intensity = 0.6
        this.dir.intensity = 0.75
        this.dir.color.setHex(0xfff0e0)
        break
    }
  }
}

let officeStateApi: OfficeStateController | null = null

export function bindOfficeStateApi(ctrl: OfficeStateController): void {
  officeStateApi = ctrl
}

export function setOfficeState(state: OfficeVisualState): void {
  officeStateApi?.setOfficeState(state)
}
