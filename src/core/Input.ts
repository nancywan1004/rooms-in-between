export class Input {
  readonly keys = new Set<string>()
  pointerLocked = false
  private interactPressed = false
  private interactQueued = false

  attach(dom: HTMLElement): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === dom
    })
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code)
    if (e.code === 'KeyE' && !this.interactPressed) {
      this.interactPressed = true
      this.interactQueued = true
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code)
    if (e.code === 'KeyE') this.interactPressed = false
  }

  consumeInteract(): boolean {
    if (!this.interactQueued) return false
    this.interactQueued = false
    return true
  }

  get moveX(): number {
    let v = 0
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) v += 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) v -= 1
    return v
  }

  get moveZ(): number {
    let v = 0
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) v -= 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) v += 1
    return v
  }

  get sprint(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
  }
}
