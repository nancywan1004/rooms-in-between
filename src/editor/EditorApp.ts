import './editor.css'
import { Engine } from '../engine/Engine'
import { loadWorkingCopy, saveWorkingCopy } from '../engine/serialize'
import { EditorCamera } from './viewport/EditorCamera'
import { createGizmo, type GizmoMode } from './viewport/Gizmo'
import { mountToolbar } from './panels/Toolbar'
import { mountHierarchy } from './panels/Hierarchy'
import { mountInspector } from './panels/Inspector'
import { mountAssets } from './panels/Assets'

export class EditorApp {
  private readonly engine: Engine
  private gizmoMode: GizmoMode = 'translate'

  constructor(root: HTMLElement) {
    root.classList.add('editor-root')
    root.innerHTML = `
      <div id="toolbar"></div>
      <div id="editor-body">
        <aside id="hierarchy"></aside>
        <div id="viewport-host">
          <div id="hud">
            <div id="debug"></div>
            <div id="crosshair"></div>
            <div id="prompt"></div>
            <div id="overlay">
              <div class="card">
                <h1>Rooms Between</h1>
                <p>点击进入办公室<br />WASD 移动 · 鼠标环视 · E 交互门 · Shift 奔跑</p>
              </div>
            </div>
          </div>
        </div>
        <aside id="inspector"></aside>
      </div>
      <div id="assets"></div>
    `

    const viewport = root.querySelector<HTMLElement>('#viewport-host')!
    this.engine = new Engine(viewport)
    const engine = this.engine

    engine.bindHud({
      overlay: root.querySelector('#overlay')!,
      prompt: root.querySelector('#prompt')!,
      crosshair: root.querySelector('#crosshair')!,
      debug: root.querySelector('#debug')!,
    })

    const editorCam = new EditorCamera(engine.editCamera, engine.canvas)
    const gizmo = createGizmo(engine.editCamera, engine.canvas, engine.scene.threeScene, editorCam, () => {
      engine.syncEditHelpers()
      saveWorkingCopy(engine.scene)
    })

    engine.onSelection((go) => gizmo.setTarget(go))
    engine.onMode((mode) => {
      const play = mode === 'play'
      root.classList.toggle('play-mode', play)
      editorCam.setEnabled(!play)
      gizmo.setEnabled(!play)
      if (play) {
        engine.overlay?.classList.remove('hidden')
      }
    })

    engine.canvas.addEventListener('pointerdown', (e) => {
      if (engine.mode !== 'edit' || e.button !== 0 || gizmo.dragging() || editorCam.isLooking()) return
      const go = engine.pick(e.clientX, e.clientY)
      engine.select(go)
    })

    engine.overlay?.addEventListener('click', () => {
      if (engine.mode === 'play') engine.canvas.requestPointerLock()
    })
    engine.canvas.addEventListener('click', () => {
      if (engine.mode === 'play' && !engine.input.pointerLocked) engine.canvas.requestPointerLock()
    })
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === engine.canvas
      engine.overlay?.classList.toggle('hidden', locked)
      engine.crosshair?.classList.toggle('visible', locked)
    })
    document.addEventListener('mousemove', (e) => {
      if (engine.mode !== 'play' || !engine.input.pointerLocked) return
      engine.player.onMouseMove(e.movementX, e.movementY)
    })

    window.addEventListener('keydown', (e) => {
      if (engine.mode === 'play') {
        if (e.code === 'Digit0') engine.officeState.setOfficeState('ORDER')
        if (e.code === 'Digit9') engine.officeState.setOfficeState('STRANGE')
        if (e.code === 'Digit8') engine.officeState.setOfficeState('PRESSURE')
        if (e.code === 'Escape' && !engine.input.pointerLocked) engine.exitPlay()
        return
      }
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (typing) return
      if (e.code === 'Delete' || e.code === 'Backspace') engine.deleteSelected()
    })

    const resize = (): void => {
      const r = viewport.getBoundingClientRect()
      engine.setSize(r.width, r.height)
    }
    new ResizeObserver(resize).observe(viewport)
    window.addEventListener('resize', resize)
    resize()

    mountToolbar(root.querySelector('#toolbar')!, engine, {
      setGizmoMode: (mode) => {
        this.gizmoMode = mode
        gizmo.setMode(mode)
      },
      getGizmoMode: () => this.gizmoMode,
      editorCam,
      onSceneReset: () => gizmo.setTarget(engine.selected),
    })
    mountHierarchy(root.querySelector('#hierarchy')!, engine)
    mountInspector(root.querySelector('#inspector')!, engine)
    mountAssets(root.querySelector('#assets')!, engine)

    if (!loadWorkingCopy(engine.scene)) {
      engine.scene.name = 'Untitled'
    }
    engine.syncEditHelpers()
    engine.notifyChange()

    window.addEventListener('beforeunload', () => saveWorkingCopy(engine.scene))

    let last = performance.now()
    const tickCam = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (engine.mode === 'edit') editorCam.update(dt)
      requestAnimationFrame(tickCam)
    }
    requestAnimationFrame(tickCam)
  }

  start(): void {
    this.engine.start()
  }
}
