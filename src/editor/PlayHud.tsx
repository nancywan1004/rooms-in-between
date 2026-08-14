import { useLayoutEffect, useRef } from 'react'
import type { Engine } from '../engine/Engine'

export function PlayHud({ engine }: { engine: Engine }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)
  const crosshairRef = useRef<HTMLDivElement>(null)
  const debugRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const prompt = promptRef.current
    const crosshair = crosshairRef.current
    const debug = debugRef.current
    if (!overlay || !prompt || !crosshair || !debug) return
    engine.bindHud({ overlay, prompt, crosshair, debug })
  }, [engine])

  return (
    <div id="hud">
      <div id="debug" ref={debugRef} />
      <div id="crosshair" ref={crosshairRef} />
      <div id="prompt" ref={promptRef} />
      <div
        id="overlay"
        ref={overlayRef}
        onClick={() => {
          if (engine.mode === 'play') engine.canvas.requestPointerLock()
        }}
      >
        <div className="card">
          <h1>Rooms Between</h1>
          <p>
            点击进入办公室
            <br />
            WASD 移动 · 鼠标环视 · E 交互门 · Shift 奔跑
          </p>
        </div>
      </div>
    </div>
  )
}
