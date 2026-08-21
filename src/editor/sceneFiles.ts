import { sceneToJson } from '../engine/serialize'
import type { Scene } from '../engine/Scene'

/** Relative to public/. Served as /assets/configs/Office MVP.json */
export const DEFAULT_SCENE_SAVE_PATH = 'assets/configs/Office MVP.json'

export type SaveSceneResult =
  | { ok: true; path: string; via: 'disk' | 'download' }
  | { ok: false; error: string }

/** Prefer writing into the project via Vite middleware; fall back to browser download. */
export async function saveSceneToLocalPath(
  scene: Scene,
  relativePath: string = DEFAULT_SCENE_SAVE_PATH,
): Promise<SaveSceneResult> {
  const path = relativePath.replace(/^\/+/, '') || DEFAULT_SCENE_SAVE_PATH
  const json = sceneToJson(scene)

  try {
    const res = await fetch('/__rib/save-scene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, json }),
    })
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; path?: string; error?: string }
      if (data.ok) return { ok: true, path: data.path || path, via: 'disk' }
      return { ok: false, error: data.error || 'Save failed' }
    }
  } catch {
    /* preview / production: no middleware */
  }

  const fileName = path.split('/').pop() || 'scene.json'
  const blob = new Blob([json], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  a.click()
  URL.revokeObjectURL(a.href)
  return { ok: true, path: fileName, via: 'download' }
}

export async function loadSceneFromLocalPath(
  relativePath: string = DEFAULT_SCENE_SAVE_PATH,
): Promise<string> {
  const path = relativePath.replace(/^\/+/, '') || DEFAULT_SCENE_SAVE_PATH
  const res = await fetch(`/${path}?t=${Date.now()}`)
  if (!res.ok) throw new Error(`Failed to load /${path} (${res.status})`)
  return res.text()
}
