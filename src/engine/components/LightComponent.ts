import * as THREE from 'three'
import { Component } from '../Component'
import { asNumber, asString } from '../ids'

export type LightKind = 'point' | 'ambient' | 'directional'

export class LightComponent extends Component {
  static readonly typeId = 'Light'

  kind: LightKind = 'point'
  color = 0xe0e8f0
  intensity = 1.8
  distance = 16

  private light: THREE.Light | null = null

  rebuild(): void {
    this.clear()
    if (this.kind === 'ambient') {
      this.light = new THREE.AmbientLight(this.color, this.intensity)
    } else if (this.kind === 'directional') {
      const dir = new THREE.DirectionalLight(this.color, this.intensity)
      dir.position.set(0, 1, 0)
      this.light = dir
    } else {
      this.light = new THREE.PointLight(this.color, this.intensity, this.distance, 2)
    }
    this.light.castShadow = false
    this.gameObject.node.add(this.light)
  }

  private clear(): void {
    if (this.light) {
      this.light.removeFromParent()
      this.light.dispose()
      this.light = null
    }
  }

  override onDestroy(): void {
    this.clear()
  }

  serialize(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      kind: this.kind,
      color: this.color,
      intensity: this.intensity,
      distance: this.distance,
    }
  }

  deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    const kind = asString(data.kind, 'point')
    this.kind = kind === 'ambient' || kind === 'directional' ? kind : 'point'
    this.color = asNumber(data.color, 0xe0e8f0)
    this.intensity = asNumber(data.intensity, 1.8)
    this.distance = asNumber(data.distance, 16)
  }
}
