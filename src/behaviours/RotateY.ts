import { Behaviour } from '../engine/Behaviour'
import { asNumber } from '../engine/ids'

export class RotateYBehaviour extends Behaviour {
  static readonly typeId = 'RotateY'
  speed = 1

  override update(dt: number): void {
    this.gameObject.node.rotation.y += this.speed * dt
  }

  override serialize(): Record<string, unknown> {
    return { ...super.serialize(), speed: this.speed }
  }

  override deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    this.speed = asNumber(data.speed, 1)
  }
}
