import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'
import type { Engine } from '../engine/Engine'
import type { EditorCamera } from './viewport/EditorCamera'
import type { GizmoApi, GizmoMode } from './viewport/Gizmo'

export type EditorSession = {
  engine: Engine
  editorCam: EditorCamera
  gizmo: GizmoApi
  gizmoMode: GizmoMode
  setGizmoMode: (mode: GizmoMode) => void
}

export const EditorContext = createContext<EditorSession | null>(null)

export function useEditor(): EditorSession | null {
  return useContext(EditorContext)
}

export function useEngine(): Engine | null {
  const ctx = useContext(EditorContext)
  const engine = ctx?.engine ?? null
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {}
      const a = engine.onChange(onStoreChange)
      const b = engine.onSelection(() => onStoreChange())
      const c = engine.onMode(() => onStoreChange())
      return () => {
        a()
        b()
        c()
      }
    },
    [engine],
  )
  useSyncExternalStore(subscribe, () => engine?.generation ?? 0)
  return engine
}
