import { registerComponent } from '../Component'
import { TransformComponent } from './TransformComponent'
import { RenderComponent } from './RenderComponent'
import { CollisionComponent } from './CollisionComponent'
import { ScriptComponent } from './ScriptComponent'
import { DoorComponent } from './DoorComponent'
import { TriggerComponent } from './TriggerComponent'
import { LightComponent } from './LightComponent'

let registered = false

export function registerBuiltinComponents(): void {
  if (registered) return
  registered = true
  registerComponent(TransformComponent)
  registerComponent(RenderComponent)
  registerComponent(CollisionComponent)
  registerComponent(ScriptComponent)
  registerComponent(DoorComponent)
  registerComponent(TriggerComponent)
  registerComponent(LightComponent)
}
