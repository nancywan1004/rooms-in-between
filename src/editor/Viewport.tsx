import { useLayoutEffect, useRef } from 'react'
import { Engine } from '../engine/Engine'
import { loadWorkingCopy, saveWorkingCopy } from '../engine/serialize'
import { EditorCamera } from './viewport/EditorCamera'
import { createGizmo } from './viewport/Gizmo'
import { PlayHud } from './PlayHud'
import type { EditorSession } from './EditorContext'

export type ViewportReady = Pick<EditorSession, 'engine' | 'editorCam' | 'gizmo'>

export function Viewport({
  session,
  onReady,
}: {
  session: ViewportReady | null
  onReady: (session: ViewportReady) => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return

    const engine = new Engine(host)
    const editorCam = new EditorCamera(engine.editCamera, engine.canvas)
    const gizmo = createGizmo(
      engine.editCamera,
      engine.canvas,
      engine.scene.threeScene,
      editorCam,
      () => {
        engine.persist({ silent: true })
      },
      (dragging) => {
        if (dragging) engine.beginHistoryGesture()
        else engine.endHistoryGesture()
      },
    )
    editorCam.hitsGizmo = () => gizmo.hovering() || gizmo.dragging()

    const unsubSel = engine.onSelection((go) => gizmo.setTarget(go))
    const unsubMode = engine.onMode((mode) => {
      const play = mode === 'play'
      editorCam.setEnabled(!play)
      gizmo.setEnabled(!play)
      if (play) engine.overlay?.classList.remove('hidden')
    })

    const onPointerUp = (e: PointerEvent): void => {
      if (engine.mode !== 'edit' || e.button !== 0) return
      if (gizmo.dragging() || gizmo.hovering()) return
      if (!editorCam.consumeClick()) return
      engine.select(engine.pick(e.clientX, e.clientY))
    }
    engine.canvas.addEventListener('pointerup', onPointerUp)

    const onCanvasClick = (): void => {
      if (engine.mode === 'play' && !engine.input.pointerLocked) engine.canvas.requestPointerLock()
    }
    engine.canvas.addEventListener('click', onCanvasClick)

    const onLockChange = (): void => {
      const locked = document.pointerLockElement === engine.canvas
      engine.overlay?.classList.toggle('hidden', locked)
      engine.crosshair?.classList.toggle('visible', locked)
    }
    document.addEventListener('pointerlockchange', onLockChange)

    const onMouseMove = (e: MouseEvent): void => {
      if (engine.mode !== 'play' || !engine.input.pointerLocked) return
      engine.player.onMouseMove(e.movementX, e.movementY)
    }
    document.addEventListener('mousemove', onMouseMove)

    const onKeyDown = (e: KeyboardEvent): void => {
      if (engine.mode === 'play') {
        if (e.code === 'Digit0') engine.officeState.setOfficeState('ORDER')
        if (e.code === 'Digit9') engine.officeState.setOfficeState('STRANGE')
        if (e.code === 'Digit8') engine.officeState.setOfficeState('PRESSURE')
        if (e.code === 'Escape' && !engine.input.pointerLocked) engine.exitPlay()
        return
      }
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (typing) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.code === 'KeyS') {
        e.preventDefault()
        window.dispatchEvent(new Event('rib:save-scene'))
        return
      }
      if (mod && e.code === 'KeyZ') {
        e.preventDefault()
        if (e.shiftKey) engine.redo()
        else engine.undo()
        return
      }
      if (mod && e.code === 'KeyY') {
        e.preventDefault()
        engine.redo()
        return
      }
      if (e.code === 'Delete' || e.code === 'Backspace') engine.deleteSelected()
    }
    window.addEventListener('keydown', onKeyDown)

    const resize = (): void => {
      const r = host.getBoundingClientRect()
      engine.setSize(r.width, r.height)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    window.addEventListener('resize', resize)
    resize()

    if (!loadWorkingCopy(engine.scene)) {
      engine.scene.name = 'Untitled'
    }
    engine.captureBaseline()
    engine.syncEditHelpers()
    engine.notifyChange()

    const onUnload = (): void => {
      saveWorkingCopy(engine.scene)
    }
    window.addEventListener('beforeunload', onUnload)

    let last = performance.now()
    let camRaf = 0
    const tickCam = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (engine.mode === 'edit') editorCam.update(dt)
      camRaf = requestAnimationFrame(tickCam)
    }
    camRaf = requestAnimationFrame(tickCam)

    engine.start()
    onReadyRef.current({ engine, editorCam, gizmo })

    return () => {
      unsubSel()
      unsubMode()
      engine.canvas.removeEventListener('pointerup', onPointerUp)
      engine.canvas.removeEventListener('click', onCanvasClick)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', resize)
      window.removeEventListener('beforeunload', onUnload)
      ro.disconnect()
      cancelAnimationFrame(camRaf)
    }
  }, [])

  return (
    <div id="viewport-host" ref={hostRef}>
      {session && <PlayHud engine={session.engine} />}
    </div>
  )
}
