import { Component } from './Component'

/** Play-mode script. Mirrors a slim MonoBehaviour lifecycle. */
export abstract class Behaviour extends Component {
  static readonly typeId: string = 'Behaviour'

  awake(): void {}
  start(): void {}
  update(_dt: number): void {}
  lateUpdate(_dt: number): void {}
}

export type BehaviourCtor = {
  new (): Behaviour
  readonly typeId: string
}

const behaviours = new Map<string, BehaviourCtor>()

export function registerBehaviour(id: string, ctor: BehaviourCtor): void {
  behaviours.set(id, ctor)
}

export function getBehaviour(id: string): BehaviourCtor | undefined {
  return behaviours.get(id)
}

export function listBehaviours(): string[] {
  return [...behaviours.keys()].sort()
}
