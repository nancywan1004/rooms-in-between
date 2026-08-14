import { Component } from '../Component'
import { Behaviour, getBehaviour } from '../Behaviour'
import { asString } from '../ids'

export class ScriptComponent extends Component {
  static readonly typeId = 'Script'

  scriptId = ''
  fields: Record<string, unknown> = {}
  private instance: Behaviour | null = null

  createBehaviour(): Behaviour | null {
    this.destroyBehaviour()
    if (!this.scriptId) return null
    const ctor = getBehaviour(this.scriptId)
    if (!ctor) return null
    const b = new ctor()
    b.gameObject = this.gameObject
    b.enabled = this.enabled
    b.deserialize(this.fields)
    this.instance = b
    return b
  }

  getBehaviour(): Behaviour | null {
    return this.instance
  }

  destroyBehaviour(): void {
    if (this.instance) {
      this.instance.onDisable()
      this.instance.onDestroy()
      this.instance = null
    }
  }

  override onDestroy(): void {
    this.destroyBehaviour()
  }

  serialize(): Record<string, unknown> {
    const live = this.instance ? this.instance.serialize() : this.fields
    return {
      enabled: this.enabled,
      scriptId: this.scriptId,
      fields: { ...live },
    }
  }

  deserialize(data: Record<string, unknown>): void {
    super.deserialize(data)
    this.scriptId = asString(data.scriptId)
    this.fields =
      data.fields && typeof data.fields === 'object' && !Array.isArray(data.fields)
        ? { ...(data.fields as Record<string, unknown>) }
        : {}
  }
}
