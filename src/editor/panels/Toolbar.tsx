import { useEffect, useRef, useState } from 'react'
import { loadSceneFromJson } from '../../engine/serialize'
import { useEditor, useEngine } from '../EditorContext'
import {
  DEFAULT_SCENE_SAVE_PATH,
  loadSceneFromLocalPath,
  saveSceneToLocalPath,
} from '../sceneFiles'
import type { CameraNavMode } from '../viewport/EditorCamera'
import type { GizmoMode } from '../viewport/Gizmo'

const CAM_MODES: CameraNavMode[] = ['orbit', 'fly']
const GIZMO_MODES: GizmoMode[] = ['translate', 'rotate', 'scale']

export function Toolbar() {
  const ctx = useEditor()
  const engine = useEngine()
  const [camMode, setCamMode] = useState<CameraNavMode>('orbit')
  const [saveHint, setSaveHint] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  useEffect(() => {
    const onSave = (): void => {
      if (!engine || engine.mode !== 'edit' || savingRef.current) return
      void (async () => {
        savingRef.current = true
        setSaving(true)
        try {
          if (!engine.scene.name || engine.scene.name === 'Untitled') {
            engine.scene.name = 'Office MVP'
          }
          const result = await saveSceneToLocalPath(engine.scene, DEFAULT_SCENE_SAVE_PATH)
          if (!result.ok) {
            setSaveHint(`Save failed: ${result.error}`)
            window.setTimeout(() => setSaveHint(''), 2500)
            return
          }
          engine.persist()
          setSaveHint(
            result.via === 'disk'
              ? `Saved public/${result.path}`
              : `Downloaded ${result.path} (dev server needed for disk write)`,
          )
          window.setTimeout(() => setSaveHint(''), 2500)
        } finally {
          savingRef.current = false
          setSaving(false)
        }
      })()
    }
    window.addEventListener('rib:save-scene', onSave)
    return () => window.removeEventListener('rib:save-scene', onSave)
  }, [engine])

  if (!ctx || !engine) return <div id="toolbar" />

  const { editorCam, gizmo, gizmoMode, setGizmoMode } = ctx
  const playing = engine.mode === 'play'

  const resetGizmo = (): void => {
    gizmo.setTarget(engine.selected)
  }

  const flash = (msg: string): void => {
    setSaveHint(msg)
    window.setTimeout(() => setSaveHint(''), 2500)
  }

  const status = playing
    ? 'PLAY'
    : saveHint
      ? saveHint
      : camMode === 'fly'
        ? 'FLY · LMB look · RMB pan · click select · WASD · Q/E up/down'
        : 'ORBIT · LMB drag orbit · RMB pan · click select · WASD · Wheel zoom'

  return (
    <div id="toolbar">
      {!playing && (
        <button type="button" className="edit-only" onClick={() => engine.enterPlay()}>
          Play
        </button>
      )}
      {playing && (
        <button type="button" onClick={() => engine.exitPlay()}>
          Stop
        </button>
      )}
      <div className="sep" />
      <button
        type="button"
        className="edit-only"
        disabled={!engine.canUndo}
        onClick={() => engine.undo()}
      >
        Undo
      </button>
      <button
        type="button"
        className="edit-only"
        disabled={!engine.canRedo}
        onClick={() => engine.redo()}
      >
        Redo
      </button>
      <div className="sep" />
      <button
        type="button"
        className="edit-only"
        disabled={saving}
        title={`Save to public/${DEFAULT_SCENE_SAVE_PATH} (Ctrl/Cmd+S)`}
        onClick={() => window.dispatchEvent(new Event('rib:save-scene'))}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button
        type="button"
        className="edit-only"
        title={`Load /${DEFAULT_SCENE_SAVE_PATH}`}
        onClick={async () => {
          try {
            const text = await loadSceneFromLocalPath(DEFAULT_SCENE_SAVE_PATH)
            loadSceneFromJson(engine.scene, text)
            engine.select(null)
            engine.persist()
            resetGizmo()
            flash(`Loaded /${DEFAULT_SCENE_SAVE_PATH}`)
          } catch (err) {
            flash(err instanceof Error ? err.message : 'Load failed')
          }
        }}
      >
        Load
      </button>
      <button
        type="button"
        className="edit-only"
        onClick={() => {
          engine.scene.clear()
          engine.scene.name = 'Untitled'
          engine.select(null)
          engine.persist()
          resetGizmo()
        }}
      >
        New
      </button>
      <div className="sep" />
      {CAM_MODES.map((m) => (
        <button
          key={m}
          type="button"
          className={`edit-only${camMode === m ? ' active' : ''}`}
          onClick={() => {
            editorCam.setMode(m)
            setCamMode(m)
          }}
        >
          {m === 'orbit' ? 'Orbit' : 'Fly'}
        </button>
      ))}
      <div className="sep" />
      {GIZMO_MODES.map((m) => (
        <button
          key={m}
          type="button"
          className={`edit-only${gizmoMode === m ? ' active' : ''}`}
          onClick={() => setGizmoMode(m)}
        >
          {m === 'translate' ? 'Move' : m === 'rotate' ? 'Rotate' : 'Scale'}
        </button>
      ))}
      <div className="spacer" />
      <span style={{ opacity: 0.7 }}>{status}</span>
    </div>
  )
}
