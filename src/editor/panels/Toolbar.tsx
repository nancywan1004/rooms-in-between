import { useState } from 'react'
import { bootstrapOfficeScene } from '../../engine/prefabs/bootstrapOffice'
import { loadSceneFromJson, sceneToJson } from '../../engine/serialize'
import { useEditor, useEngine } from '../EditorContext'
import type { CameraNavMode } from '../viewport/EditorCamera'
import type { GizmoMode } from '../viewport/Gizmo'

const CAM_MODES: CameraNavMode[] = ['orbit', 'fly']
const GIZMO_MODES: GizmoMode[] = ['translate', 'rotate', 'scale']

export function Toolbar() {
  const ctx = useEditor()
  const engine = useEngine()
  const [camMode, setCamMode] = useState<CameraNavMode>('orbit')

  if (!ctx || !engine) return <div id="toolbar" />

  const { editorCam, gizmo, gizmoMode, setGizmoMode } = ctx
  const playing = engine.mode === 'play'

  const resetGizmo = (): void => {
    gizmo.setTarget(engine.selected)
  }

  const status = playing
    ? 'PLAY'
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
        onClick={() => {
          bootstrapOfficeScene(engine.scene)
          engine.select(null)
          engine.persist()
          resetGizmo()
        }}
      >
        Load Office MVP
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
      <button
        type="button"
        className="edit-only"
        onClick={() => {
          const blob = new Blob([sceneToJson(engine.scene)], { type: 'application/json' })
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `${engine.scene.name || 'scene'}.json`
          a.click()
          URL.revokeObjectURL(a.href)
        }}
      >
        Export JSON
      </button>
      <label className="file-btn edit-only">
        Import JSON
        <input
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const text = await file.text()
            loadSceneFromJson(engine.scene, text)
            engine.select(null)
            engine.persist()
            resetGizmo()
            e.target.value = ''
          }}
        />
      </label>
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
