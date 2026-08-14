import { registerBehaviour } from '../engine/Behaviour'
import { RotateYBehaviour } from './RotateY'
import { ManagerPatrolBehaviour } from './ManagerPatrol'

let registered = false

export function registerBehaviours(): void {
  if (registered) return
  registered = true
  registerBehaviour('RotateY', RotateYBehaviour)
  registerBehaviour('ManagerPatrol', ManagerPatrolBehaviour)
}
