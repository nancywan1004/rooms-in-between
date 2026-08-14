import * as THREE from 'three'

export type CameraNavMode = 'orbit' | 'fly'

const LOOK_SENS = 0.005
const ORBIT_SENS = 0.005
const PAN_SENS = 0.0022
const DOLLY_FACTOR = 1.12
const FLY_SPEED = 8
const FLY_FAST = 18

export class EditorCamera {
  mode: CameraNavMode = 'orbit'
  enabled = true
  /** Set true while the transform gizmo is dragging. */
  blocked = false

  readonly target = new THREE.Vector3()

  private readonly camera: THREE.PerspectiveCamera
  private readonly dom: HTMLElement
  private readonly keys = new Set<string>()
  private readonly spherical = new THREE.Spherical()
  private readonly offset = new THREE.Vector3()
  private readonly panOffset = new THREE.Vector3()
  private readonly right = new THREE.Vector3()
  private readonly forward = new THREE.Vector3()
  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ')
  private readonly panUp = new THREE.Vector3()
  private readonly worldUp = new THREE.Vector3(0, 1, 0)

  private lmb = false
  private mmb = false
  private rmb = false
  private alt = false
  private lastX = 0
  private lastY = 0
  private flyYaw = 0
  private flyPitch = -0.5

  constructor(camera: THREE.PerspectiveCamera, dom: HTMLElement) {
    this.camera = camera
    this.dom = dom
    this.syncFromCamera()
    this.bind()
  }

  setMode(mode: CameraNavMode): void {
    this.mode = mode
    if (mode === 'fly') this.syncFlyFromCamera()
    else this.syncFromCamera()
  }

  setEnabled(on: boolean): void {
    this.enabled = on
    if (!on) {
      this.lmb = this.mmb = this.rmb = false
      this.keys.clear()
    }
  }

  isLooking(): boolean {
    return this.rmb || this.mmb || (this.lmb && this.alt)
  }

  update(dt: number): void {
    if (!this.enabled || this.blocked) return
    const speed = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? FLY_FAST : FLY_SPEED) * dt

    if (this.mode === 'fly') {
      this.euler.set(this.flyPitch, this.flyYaw, 0, 'YXZ')
      this.camera.quaternion.setFromEuler(this.euler)
      this.forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion)
      this.right.set(1, 0, 0).applyQuaternion(this.camera.quaternion)
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.camera.position.addScaledVector(this.forward, speed)
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.camera.position.addScaledVector(this.forward, -speed)
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.camera.position.addScaledVector(this.right, speed)
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.camera.position.addScaledVector(this.right, -speed)
      if (this.keys.has('KeyE')) this.camera.position.y += speed
      if (this.keys.has('KeyQ')) this.camera.position.y -= speed
      this.target.copy(this.camera.position).addScaledVector(this.forward, 6)
      return
    }

    this.forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion)
    this.forward.y = 0
    if (this.forward.lengthSq() < 1e-6) this.forward.set(0, 0, -1)
    this.forward.normalize()
    this.right.crossVectors(this.forward, this.worldUp).normalize()

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.panOffset.addScaledVector(this.forward, speed)
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.panOffset.addScaledVector(this.forward, -speed)
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.panOffset.addScaledVector(this.right, speed)
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.panOffset.addScaledVector(this.right, -speed)
    if (this.keys.has('KeyE')) this.panOffset.y += speed
    if (this.keys.has('KeyQ')) this.panOffset.y -= speed

    this.target.add(this.panOffset)
    this.camera.position.add(this.panOffset)
    this.panOffset.set(0, 0, 0)

    this.offset.copy(this.camera.position).sub(this.target)
    this.spherical.setFromVector3(this.offset)
    this.offset.setFromSpherical(this.spherical)
    this.camera.position.copy(this.target).add(this.offset)
    this.camera.lookAt(this.target)
  }

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.onPointerDown)
    this.dom.removeEventListener('pointermove', this.onPointerMove)
    this.dom.removeEventListener('pointerup', this.onPointerUp)
    this.dom.removeEventListener('pointerleave', this.onPointerUp)
    this.dom.removeEventListener('wheel', this.onWheel)
    this.dom.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  private syncFromCamera(): void {
    this.offset.copy(this.camera.position).sub(this.target)
    if (this.offset.lengthSq() < 0.01) this.offset.set(0, 4, 8)
    this.spherical.setFromVector3(this.offset)
    this.camera.lookAt(this.target)
  }

  private syncFlyFromCamera(): void {
    const e = this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ')
    this.flyYaw = e.y
    this.flyPitch = e.x
  }

  private bind(): void {
    this.dom.style.touchAction = 'none'
    this.dom.addEventListener('pointerdown', this.onPointerDown)
    this.dom.addEventListener('pointermove', this.onPointerMove)
    this.dom.addEventListener('pointerup', this.onPointerUp)
    this.dom.addEventListener('pointerleave', this.onPointerUp)
    this.dom.addEventListener('wheel', this.onWheel, { passive: false })
    this.dom.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  private onContextMenu = (e: Event): void => {
    e.preventDefault()
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (!this.enabled) return
    if (e.button === 0) this.lmb = true
    if (e.button === 1) this.mmb = true
    if (e.button === 2) this.rmb = true
    this.lastX = e.clientX
    this.lastY = e.clientY
    if (e.button === 1 || e.button === 2) {
      this.dom.setPointerCapture(e.pointerId)
      e.preventDefault()
    }
  }

  private onPointerUp = (e: PointerEvent): void => {
    if (e.button === 0) this.lmb = false
    if (e.button === 1) this.mmb = false
    if (e.button === 2) this.rmb = false
    if (this.dom.hasPointerCapture(e.pointerId)) this.dom.releasePointerCapture(e.pointerId)
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.enabled || this.blocked) return
    const dx = e.clientX - this.lastX
    const dy = e.clientY - this.lastY
    this.lastX = e.clientX
    this.lastY = e.clientY

    const orbiting = this.mmb || (this.lmb && this.alt)
    const panning = this.mode === 'orbit' && this.rmb
    const looking = this.mode === 'fly' && this.rmb

    if (looking) {
      this.flyYaw -= dx * LOOK_SENS
      this.flyPitch -= dy * LOOK_SENS
      const lim = Math.PI / 2 - 0.05
      this.flyPitch = Math.max(-lim, Math.min(lim, this.flyPitch))
      return
    }

    if (orbiting) {
      this.spherical.theta -= dx * ORBIT_SENS
      this.spherical.phi -= dy * ORBIT_SENS
      this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi))
      this.offset.setFromSpherical(this.spherical)
      this.camera.position.copy(this.target).add(this.offset)
      this.camera.lookAt(this.target)
      return
    }

    if (panning) {
      const dist = this.camera.position.distanceTo(this.target)
      const panX = -dx * PAN_SENS * dist
      const panY = dy * PAN_SENS * dist
      this.right.set(1, 0, 0).applyQuaternion(this.camera.quaternion)
      this.panUp.set(0, 1, 0).applyQuaternion(this.camera.quaternion)
      this.panOffset.addScaledVector(this.right, panX)
      this.panOffset.addScaledVector(this.panUp, panY)
      this.target.add(this.panOffset)
      this.camera.position.add(this.panOffset)
      this.panOffset.set(0, 0, 0)
    }
  }

  private onWheel = (e: WheelEvent): void => {
    if (!this.enabled || this.blocked) return
    e.preventDefault()
    const dir = e.deltaY > 0 ? DOLLY_FACTOR : 1 / DOLLY_FACTOR
    if (this.mode === 'fly') {
      this.forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion)
      this.camera.position.addScaledVector(this.forward, e.deltaY > 0 ? -1.2 : 1.2)
      return
    }
    this.spherical.radius = Math.max(0.5, Math.min(120, this.spherical.radius * dir))
    this.offset.setFromSpherical(this.spherical)
    this.camera.position.copy(this.target).add(this.offset)
    this.camera.lookAt(this.target)
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'AltLeft' || e.code === 'AltRight') this.alt = true
    if (!this.enabled) return
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    this.keys.add(e.code)
    if (
      e.code === 'KeyW' ||
      e.code === 'KeyA' ||
      e.code === 'KeyS' ||
      e.code === 'KeyD' ||
      e.code === 'KeyQ' ||
      e.code === 'KeyE' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight'
    ) {
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'AltLeft' || e.code === 'AltRight') this.alt = false
    this.keys.delete(e.code)
  }
}
