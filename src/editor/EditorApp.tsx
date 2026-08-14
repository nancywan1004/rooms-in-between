import { useMemo, useState, type ReactNode } from 'react'
import './editor.css'
import { EditorContext, useEngine, type EditorSession } from './EditorContext'
import { Assets } from './panels/Assets'
import { Hierarchy } from './panels/Hierarchy'
import { Inspector } from './panels/Inspector'
import { Toolbar } from './panels/Toolbar'
import { Viewport, type ViewportReady } from './Viewport'
import type { GizmoMode } from './viewport/Gizmo'

export function EditorApp() {
  const [ready, setReady] = useState<ViewportReady | null>(null)
  const [gizmoMode, setGizmoModeState] = useState<GizmoMode>('translate')

  const session = useMemo<EditorSession | null>(() => {
    if (!ready) return null
    return {
      engine: ready.engine,
      editorCam: ready.editorCam,
      gizmo: ready.gizmo,
      gizmoMode,
      setGizmoMode: (mode: GizmoMode) => {
        setGizmoModeState(mode)
        ready.gizmo.setMode(mode)
      },
    }
  }, [ready, gizmoMode])

  return (
    <EditorContext.Provider value={session}>
      <EditorChrome>
        <Toolbar />
        <div id="editor-body">
          <Hierarchy />
          <Viewport session={ready} onReady={setReady} />
          <Inspector />
        </div>
        <Assets />
      </EditorChrome>
    </EditorContext.Provider>
  )
}

function EditorChrome({ children }: { children: ReactNode }) {
  const engine = useEngine()
  const play = engine?.mode === 'play'
  return <div className={play ? 'editor-root play-mode' : 'editor-root'}>{children}</div>
}
