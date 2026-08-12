import * as THREE from 'three'
import { Input } from './Input'
import { PlayerController } from './PlayerController'
import { ColliderWorld } from '../world/colliders'
import { DoorRegistry } from '../world/doors'
import { TriggerRegistry } from '../world/triggers'
import { buildOffice, type OfficeWorld } from '../world/buildOffice'
import { officeLayout } from '../world/layout'
import {
  OfficeStateController,
  bindOfficeStateApi,
} from '../systems/OfficeState'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

export class Game {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly input = new Input()
  private readonly player: PlayerController
  private readonly colliders = new ColliderWorld()
  private readonly doors = new DoorRegistry()
  private readonly triggers = new TriggerRegistry()
  private readonly officeState = new OfficeStateController()
  private world!: OfficeWorld

  private readonly hemi: THREE.HemisphereLight
  private readonly sun: THREE.DirectionalLight

  private readonly overlay: HTMLElement
  private readonly promptEl: HTMLElement
  private readonly crosshair: HTMLElement
  private readonly debugEl: HTMLElement

  private last = 0
  private promptTimer = 0
  private running = false

  constructor(container: HTMLElement) {
    RectAreaLightUniformsLib.init()

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    this.player = new PlayerController(window.innerWidth / window.innerHeight)
    this.player.setSpawn(officeLayout.spawn.x, officeLayout.spawn.z, officeLayout.spawn.yaw)

    this.hemi = new THREE.HemisphereLight(0xf5efe6, 0xc8bfb2, 0.55)
    this.scene.add(this.hemi)

    this.sun = new THREE.DirectionalLight(0xfff6ea, 0.85)
    this.sun.position.set(8, 18, 6)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.near = 1
    this.sun.shadow.camera.far = 60
    this.sun.shadow.camera.left = -20
    this.sun.shadow.camera.right = 20
    this.sun.shadow.camera.top = 20
    this.sun.shadow.camera.bottom = -20
    this.scene.add(this.sun)

    // Soft key RectAreaLight over open office
    const rect = new THREE.RectAreaLight(0xfff5ea, 2.5, 10, 8)
    rect.position.set(0, 3.2, 0)
    rect.lookAt(0, 0, 0)
    this.scene.add(rect)

    this.officeState.bind(this.scene, this.hemi, this.sun)
    bindOfficeStateApi(this.officeState)

    this.world = buildOffice(this.scene, this.colliders, this.doors, this.triggers)

    this.overlay = document.getElementById('overlay')!
    this.promptEl = document.getElementById('prompt')!
    this.crosshair = document.getElementById('crosshair')!
    this.debugEl = document.getElementById('debug')!

    this.input.attach(this.renderer.domElement)

    this.overlay.addEventListener('click', () => this.requestLock())
    this.renderer.domElement.addEventListener('click', () => {
      if (!this.input.pointerLocked) this.requestLock()
    })
    document.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('resize', this.onResize)

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === this.renderer.domElement
      this.overlay.classList.toggle('hidden', locked)
      this.crosshair.classList.toggle('visible', locked)
    })

    // Dev helper: unlock doors with keys 1-4
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') this.doors.setState('door_printer', 'closed')
      if (e.code === 'Digit2') this.doors.setState('door_break', 'closed')
      if (e.code === 'Digit3') {
        this.doors.setState('door_manager', 'unlocked')
        this.doors.setState('door_manager', 'closed')
      }
      if (e.code === 'Digit4') {
        this.doors.setState('door_meeting', 'unlocked')
        this.doors.setState('door_meeting', 'closed')
      }
      if (e.code === 'Digit0') this.officeState.setOfficeState('ORDER')
      if (e.code === 'Digit9') this.officeState.setOfficeState('STRANGE')
      if (e.code === 'Digit8') this.officeState.setOfficeState('PRESSURE')
    })
  }

  start(): void {
    this.running = true
    this.last = performance.now()
    requestAnimationFrame(this.frame)
  }

  private requestLock(): void {
    this.renderer.domElement.requestPointerLock()
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.input.pointerLocked) return
    this.player.onMouseMove(e.movementX, e.movementY)
  }

  private onResize = (): void => {
    const w = window.innerWidth
    const h = window.innerHeight
    this.player.camera.aspect = w / h
    this.player.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private frame = (now: number): void => {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now

    if (this.input.pointerLocked) {
      this.player.update(dt, this.input, this.colliders)
    }

    this.world.manager.update(dt)

    const entered = this.triggers.update(
      this.player.position.x,
      1.0,
      this.player.position.z,
    )
    for (const id of entered) {
      console.log(`[Trigger] enter ${id}`)
    }

    // Door interaction prompt
    const near = this.doors.findNearest(this.player.position.x, this.player.position.z)
    if (near && this.input.pointerLocked) {
      const label =
        near.state === 'locked'
          ? `E — ${near.id} (locked)`
          : near.state === 'open'
            ? `E — Close ${near.id}`
            : `E — Open ${near.id}`
      this.showPrompt(label, 0.15)
    }

    if (this.input.consumeInteract()) {
      const result = this.doors.tryInteract(this.player.position.x, this.player.position.z)
      if (result.message) this.showPrompt(result.message, 2.5)
    }

    if (this.promptTimer > 0) {
      this.promptTimer -= dt
      if (this.promptTimer <= 0) this.promptEl.classList.remove('visible')
    }

    this.debugEl.textContent =
      `pos ${this.player.position.x.toFixed(1)}, ${this.player.position.z.toFixed(1)}\n` +
      `state ${this.officeState.current}\n` +
      `doors M:${this.doors.get('door_manager')?.state} Mt:${this.doors.get('door_meeting')?.state}`

    this.renderer.render(this.scene, this.player.camera)
    requestAnimationFrame(this.frame)
  }

  private showPrompt(text: string, duration: number): void {
    this.promptEl.textContent = text
    this.promptEl.classList.add('visible')
    this.promptTimer = duration
  }
}
