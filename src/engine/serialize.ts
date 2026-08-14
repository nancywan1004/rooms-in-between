import { createComponent } from './Component'
import { Scene } from './Scene'
import { SceneGameObject } from './SceneGameObject'
import { TransformComponent } from './components/TransformComponent'
import { hydrateGameObject } from './prefabs/factories'
import { asBool, asString } from './ids'

export type SerializedObject = {
  uuid: string
  name: string
  active: boolean
  tags: string[]
  prefabId?: string
  components: { type: string; data: Record<string, unknown> }[]
  children: SerializedObject[]
}

export type SceneAsset = {
  version: 1
  name: string
  objects: SerializedObject[]
}

export const SCENE_STORAGE_KEY = 'rib.scene.current'

export function serializeScene(scene: Scene): SceneAsset {
  return {
    version: 1,
    name: scene.name,
    objects: scene.roots.map(serializeObject),
  }
}

function serializeObject(go: SceneGameObject): SerializedObject {
  return {
    uuid: go.uuid,
    name: go.name,
    active: go.active,
    tags: [...go.tags],
    prefabId: go.prefabId,
    components: go.components.map((c) => ({
      type: c.typeId,
      data: c.serialize(),
    })),
    children: go.children.map(serializeObject),
  }
}

export function deserializeScene(scene: Scene, asset: SceneAsset): void {
  scene.clear()
  scene.name = asset.name || 'Untitled'
  for (const obj of asset.objects) {
    scene.add(buildObject(obj))
  }
}

function buildObject(data: SerializedObject): SceneGameObject {
  const go = new SceneGameObject(data.name || 'GameObject', data.uuid)
  go.active = asBool(data.active, true)
  go.tags = Array.isArray(data.tags) ? data.tags.map(String) : []
  go.prefabId = data.prefabId
  go.node.name = go.name

  for (const entry of data.components ?? []) {
    const type = asString(entry.type)
    if (type === TransformComponent.typeId) {
      go.transform.deserialize(entry.data ?? {})
      continue
    }
    const comp = createComponent(type)
    if (!comp) continue
    go.attachComponent(comp)
    comp.deserialize(entry.data ?? {})
  }

  hydrateGameObject(go)

  for (const child of data.children ?? []) {
    go.addChild(buildObject(child))
  }
  return go
}

export function sceneToJson(scene: Scene): string {
  return JSON.stringify(serializeScene(scene), null, 2)
}

export function loadSceneFromJson(scene: Scene, json: string): void {
  const parsed = JSON.parse(json) as SceneAsset
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.objects)) {
    throw new Error('Invalid scene asset')
  }
  deserializeScene(scene, parsed)
}

export function saveWorkingCopy(scene: Scene): void {
  try {
    localStorage.setItem(SCENE_STORAGE_KEY, sceneToJson(scene))
  } catch {
    /* quota */
  }
}

export function loadWorkingCopy(scene: Scene): boolean {
  try {
    const raw = localStorage.getItem(SCENE_STORAGE_KEY)
    if (!raw) return false
    loadSceneFromJson(scene, raw)
    return true
  } catch {
    return false
  }
}
