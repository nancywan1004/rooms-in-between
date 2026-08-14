import type { Engine } from '../../engine/Engine'
import { bootstrapOfficeScene } from '../../engine/prefabs/bootstrapOffice'
import { loadSceneFromJson, saveWorkingCopy, sceneToJson } from '../../engine/serialize'
import type { GizmoMode } from '../viewport/Gizmo'
import type { CameraNavMode, EditorCamera } from '../viewport/EditorCamera'

export function mountToolbar(
  el: HTMLElement,
  engine: Engine,
  opts: {
    setGizmoMode: (mode: GizmoMode) => void
    getGizmoMode: () => GizmoMode
    editorCam: EditorCamera
    onSceneReset: () => void
  },
): void {
  el.innerHTML = ''

  const btn = (label: string, onClick: () => void, cls = ''): HTMLButtonElement => {
    const b = document.createElement('button')
    b.textContent = label
    if (cls) b.className = cls
    b.addEventListener('click', onClick)
    el.appendChild(b)
    return b
  }

  const play = btn('Play', () => {
    if (engine.mode === 'edit') engine.enterPlay()
  })
  const stop = btn('Stop', () => {
    if (engine.mode === 'play') engine.exitPlay()
  })
  play.classList.add('edit-only')

  const sep = () => {
    const s = document.createElement('div')
    s.className = 'sep'
    el.appendChild(s)
  }
  sep()

  btn(
    'Load Office MVP',
    () => {
      bootstrapOfficeScene(engine.scene)
      engine.select(null)
      engine.syncEditHelpers()
      saveWorkingCopy(engine.scene)
      engine.notifyChange()
      opts.onSceneReset()
    },
    'edit-only',
  )

  btn(
    'New',
    () => {
      engine.scene.clear()
      engine.scene.name = 'Untitled'
      engine.select(null)
      saveWorkingCopy(engine.scene)
      engine.notifyChange()
      opts.onSceneReset()
    },
    'edit-only',
  )

  btn(
    'Export JSON',
    () => {
      const blob = new Blob([sceneToJson(engine.scene)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${engine.scene.name || 'scene'}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    },
    'edit-only',
  )

  const fileBtn = document.createElement('label')
  fileBtn.className = 'file-btn edit-only'
  fileBtn.textContent = 'Import JSON'
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.hidden = true
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    loadSceneFromJson(engine.scene, text)
    engine.select(null)
    engine.syncEditHelpers()
    saveWorkingCopy(engine.scene)
    engine.notifyChange()
    opts.onSceneReset()
    input.value = ''
  })
  fileBtn.appendChild(input)
  el.appendChild(fileBtn)

  sep()

  const camModes: CameraNavMode[] = ['orbit', 'fly']
  const camBtns: HTMLButtonElement[] = []
  for (const m of camModes) {
    const b = btn(
      m === 'orbit' ? 'Orbit' : 'Fly',
      () => {
        opts.editorCam.setMode(m)
        syncMode()
      },
      'edit-only',
    )
    camBtns.push(b)
  }

  sep()

  const modes: GizmoMode[] = ['translate', 'rotate', 'scale']
  const modeBtns: HTMLButtonElement[] = []
  for (const m of modes) {
    const label = m === 'translate' ? 'Move' : m === 'rotate' ? 'Rotate' : 'Scale'
    const b = btn(
      label,
      () => {
        opts.setGizmoMode(m)
        syncMode()
      },
      'edit-only',
    )
    modeBtns.push(b)
  }

  const spacer = document.createElement('div')
  spacer.className = 'spacer'
  el.appendChild(spacer)

  const status = document.createElement('span')
  status.style.opacity = '0.7'
  el.appendChild(status)

  const syncMode = (): void => {
    const cur = opts.getGizmoMode()
    modeBtns.forEach((b, i) => b.classList.toggle('active', modes[i] === cur))
    camBtns.forEach((b, i) => b.classList.toggle('active', camModes[i] === opts.editorCam.mode))
    if (engine.mode === 'play') {
      status.textContent = 'PLAY'
    } else if (opts.editorCam.mode === 'fly') {
      status.textContent = 'FLY · RMB look · WASD · Q/E up/down'
    } else {
      status.textContent = 'ORBIT · MMB orbit · RMB pan · WASD · Wheel zoom'
    }
    play.style.display = engine.mode === 'play' ? 'none' : ''
    stop.style.display = engine.mode === 'edit' ? 'none' : ''
  }

  engine.onMode(syncMode)
  engine.onChange(syncMode)
  syncMode()
}
