import type { SceneGameObject } from './SceneGameObject'
import type { TransformComponent } from './components/TransformComponent'

export type ComponentCtor<T extends Component = Component> = {
  new (): T
  readonly typeId: string
}

export abstract class Component {
  static readonly typeId: string = 'Component'
  gameObject!: SceneGameObject
  enabled = true

  get typeId(): string {
    return (this.constructor as ComponentCtor).typeId
  }

  get transform(): TransformComponent {
    return this.gameObject.transform
  }

  serialize(): Record<string, unknown> {
    return { enabled: this.enabled }
  }

  deserialize(data: Record<string, unknown>): void {
    if (typeof data.enabled === 'boolean') this.enabled = data.enabled
  }

  onEnable(): void {}
  onDisable(): void {}
  onDestroy(): void {}
}

const registry = new Map<string, ComponentCtor>()

export function registerComponent<T extends Component>(ctor: ComponentCtor<T>): void {
  registry.set(ctor.typeId, ctor)
}

export function getComponentCtor(typeId: string): ComponentCtor | undefined {
  return registry.get(typeId)
}

export function createComponent(typeId: string): Component | undefined {
  const ctor = registry.get(typeId)
  return ctor ? new ctor() : undefined
}
