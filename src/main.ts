import { Game } from './core/Game'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

const game = new Game(app)
game.start()

// Expose for console debugging / Agent Spec API
import { setOfficeState } from './systems/OfficeState'
;(window as unknown as { setOfficeState: typeof setOfficeState }).setOfficeState = setOfficeState
