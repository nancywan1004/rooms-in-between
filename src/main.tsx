import { createRoot } from 'react-dom/client'
import { Game } from './core/Game'
import { EditorApp } from './editor/EditorApp'
import { setOfficeState } from './systems/OfficeState'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

const legacy = new URLSearchParams(location.search).has('legacy')

if (legacy) {
  const game = new Game(app)
  game.start()
} else {
  document.getElementById('hud')?.remove()
  createRoot(app).render(<EditorApp />)
}

;(window as unknown as { setOfficeState: typeof setOfficeState }).setOfficeState = setOfficeState
