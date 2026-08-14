import * as THREE from 'three'
import { Input } from '../core/Input'
import { PlayerController } from '../core/PlayerController'
import { PostFX } from '../core/PostFX'
import { ColliderWorld } from '../world/colliders'
import { OfficeStateController, bindOfficeStateApi } from '../systems/OfficeState'
import { CrtFlicker } from '../systems/CrtFlicker'
import { Scene } from './Scene'
import { SceneGameObject } from './SceneGameObject'
import { Behaviour } from './Behaviour'
import { CollisionComponent } from './components/CollisionComponent'
import { DoorComponent } from './components/DoorComponent'
import { TriggerComponent } from './components/TriggerComponent'
import { ScriptComponent } from './components/ScriptComponent'
import { registerBuiltinComponents } from './components/register'
import { registerBehaviours } from '../behaviours/register'
import { loadSceneFromJson, saveWorkingCopy, sceneToJson } from './serialize'
import { officeLayout } from '../world/layout'

export type EngineMode = 'edit' | 'play'

export class Engine {
  readonly renderer: THREE.WebGLRenderer
  readonly scene: Scene
  readonly colliders = new ColliderWorld()
  readonly input = new Input()
  readonly player: PlayerController
  readonly officeState = new OfficeStateController()
  readonly editCamera: THREE.PerspectiveCamera
  readonly hemi: THREE.HemisphereLight
  readonly sun: THREE.DirectionalLight

  mode: EngineMode = 'edit'
  selected: SceneGameObject | null = null

  private readonly postFX: PostFX
  private readonly crt = new CrtFlicker()
  private readonly helperRoot = new THREE.Group()
  private readonly grid: THREE.GridHelper
  private playSnapshot: string | null = null
  private behaviours: Behaviour[] = []
  private started = new WeakSet<Behaviour>()
  private running = false
  private last = 0
  private promptTimer = 0
  private readonly selectionListeners = new Set<(go: SceneGameObject | null) => void>()
  private readonly modeListeners = new Set<(mode: EngineMode) => void>()
  private readonly changeListeners = new Set<() => void>()
  private readonly raycaster = new THREE.Raycaster()
  private readonly ndc = new THREE.Vector2()

  overlay: HTMLElement | null = null
  promptEl: HTMLElement | null = null
  crosshair: HTMLElement | null = null
  debugEl: HTMLElement | null = null

  constructor(host: HTMLElement) {
    registerBuiltinComponents()
    registerBehaviours()

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(this.renderer.domElement)

    this.scene = new Scene()
    this.scene.threeScene.background = new THREE.Color(0x8a9098)
    this.scene.threeScene.fog = new THREE.FogExp2(0x8a9098, 0.022)

    this.editCamera = new THREE.PerspectiveCamera(60, 1, 0.08, 200)
    this.editCamera.position.set(8, 10, 14)
    this.editCamera.lookAt(0, 0, 0)

    this.player = new PlayerController(1)
    this.player.setSpawn(officeLayout.spawn.x, officeLayout.spawn.z, officeLayout.spawn.yaw)

    this.hemi = new THREE.HemisphereLight(0xe8eef4, 0x5a5854, 0.55)
    this.sun = new THREE.DirectionalLight(0xf0f4f8, 0.65)
    this.sun.position.set(3, 14, 1)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(1024, 1024)
    this.sun.shadow.camera.near = 1
    this.sun.shadow.camera.far = 50
    this.sun.shadow.camera.left = -18
    this.sun.shadow.camera.right = 18
    this.sun.shadow.camera.top = 18
    this.sun.shadow.camera.bottom = -18
    this.sun.shadow.bias = -0.0003
    this.scene.threeScene.add(this.hemi, this.sun)

    this.officeState.bind(this.scene.threeScene, this.hemi, this.sun)
    bindOfficeStateApi(this.officeState)

    this.helperRoot.name = '__editorHelpers'
    this.helperRoot.userData.editorOnly = true
    this.grid = new THREE.GridHelper(40, 40, 0x6a7078, 0x3a3e44)
    this.grid.userData.editorOnly = true
    this.helperRoot.add(this.grid)
    this.scene.threeScene.add(this.helperRoot)

    this.postFX = new PostFX(this.renderer, this.scene.threeScene, this.editCamera)
    this.postFX.setMood('ORDER')
    this.officeState.onMood((s) => this.postFX.setMood(s))

    this.input.attach(this.renderer.domElement)
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  get camera(): THREE.PerspectiveCamera {
    return this.mode === 'play' ? this.player.camera : this.editCamera
  }

  bindHud(els: {
    overlay: HTMLElement
    prompt: HTMLElement
    crosshair: HTMLElement
    debug: HTMLElement
  }): void {
    this.overlay = els.overlay
    this.promptEl = els.prompt
    this.crosshair = els.crosshair
    this.debugEl = els.debug
  }

  onSelection(fn: (go: SceneGameObject | null) => void): () => void {
    this.selectionListeners.add(fn)
    return () => this.selectionListeners.delete(fn)
  }

  onMode(fn: (mode: EngineMode) => void): () => void {
    this.modeListeners.add(fn)
    return () => this.modeListeners.delete(fn)
  }

  onChange(fn: () => void): () => void {
    this.changeListeners.add(fn)
    return () => this.changeListeners.delete(fn)
  }

  notifyChange(): void {
    this.changeListeners.forEach((fn) => fn())
  }

  select(go: SceneGameObject | null): void {
    this.selected = go
    this.selectionListeners.forEach((fn) => fn(go))
  }

  start(): void {
    this.running = true
    this.last = performance.now()
    requestAnimationFrame(this.frame)
  }

  setSize(w: number, h: number): void {
    const aspect = Math.max(w, 1) / Math.max(h, 1)
    this.editCamera.aspect = aspect
    this.editCamera.updateProjectionMatrix()
    this.player.camera.aspect = aspect
    this.player.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
    this.postFX.setSize(w, h)
  }

  pick(clientX: number, clientY: number): SceneGameObject | null {
    const rect = this.canvas.getBoundingClientRect()
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.ndc, this.editCamera)
    const hits = this.raycaster.intersectObject(this.scene.threeScene, true)
    for (const hit of hits) {
      if (hit.object.userData.editorOnly) continue
      let obj: THREE.Object3D | null = hit.object
      while (obj) {
        const go = obj.userData.sceneGameObject as SceneGameObject | undefined
        if (go) return go
        if (obj.userData.editorOnly) break
        obj = obj.parent
      }
    }
    return null
  }

  enterPlay(): void {
    if (this.mode === 'play') return
    this.playSnapshot = sceneToJson(this.scene)
    saveWorkingCopy(this.scene)
    this.mode = 'play'
    this.helperRoot.visible = false
    this.select(null)

    const spawn = this.scene.findByTag('Spawn')
    if (spawn) {
      const p = spawn.transform.position
      this.player.setSpawn(p.x, p.z, spawn.node.rotation.y)
    } else {
      this.player.setSpawn(officeLayout.spawn.x, officeLayout.spawn.z, officeLayout.spawn.yaw)
    }

    this.rebuildColliders()
    this.bootBehaviours()
    this.postFX.setCamera(this.player.camera)
    this.modeListeners.forEach((fn) => fn('play'))
  }

  exitPlay(): void {
    if (this.mode !== 'edit' && this.playSnapshot) {
      this.teardownBehaviours()
      try {
        loadSceneFromJson(this.scene, this.playSnapshot)
      } catch {
        /* keep */
      }
      this.playSnapshot = null
    }
    this.mode = 'edit'
    this.helperRoot.visible = true
    this.colliders.clear()
    this.syncEditHelpers()
    this.postFX.setCamera(this.editCamera)
    if (this.overlay) this.overlay.classList.remove('hidden')
    if (this.crosshair) this.crosshair.classList.remove('visible')
    if (document.pointerLockElement) document.exitPointerLock()
    this.modeListeners.forEach((fn) => fn('edit'))
    this.notifyChange()
  }

  rebuildColliders(): void {
    this.colliders.clear()
    this.scene.traverse((go) => {
      const col = go.getComponent(CollisionComponent)
      if (col) col.syncToWorld(this.colliders)
      const door = go.getComponent(DoorComponent)
      if (door) door.syncCollider(this.colliders)
    })
  }

  syncEditHelpers(): void {
    const show = this.mode === 'edit'
    this.scene.traverse((go) => {
      go.getComponent(CollisionComponent)?.showHelper(this.helperRoot, show)
      go.getComponent(TriggerComponent)?.showHelper(this.helperRoot, show)
    })
  }

  addRoot(go: SceneGameObject): void {
    this.scene.add(go)
    this.notifyChange()
  }

  deleteSelected(): void {
    if (!this.selected) return
    const go = this.selected
    this.select(null)
    if (go.parent) go.parent.removeChild(go)
    else this.scene.remove(go)
    go.destroy()
    this.notifyChange()
  }

  private bootBehaviours(): void {
    this.behaviours = []
    this.scene.traverse((go) => {
      if (!go.activeInHierarchy) return
      const script = go.getComponent(ScriptComponent)
      if (!script || !script.enabled) return
      const b = script.createBehaviour()
      if (b) this.behaviours.push(b)
    })
    for (const b of this.behaviours) {
      if (b.enabled) {
        b.awake()
        b.onEnable()
      }
    }
    for (const b of this.behaviours) {
      if (b.enabled) {
        b.start()
        this.started.add(b)
      }
    }
  }

  private teardownBehaviours(): void {
    for (const b of this.behaviours) {
      b.onDisable()
      b.onDestroy()
    }
    this.behaviours = []
    this.scene.traverse((go) => go.getComponent(ScriptComponent)?.destroyBehaviour())
  }

  private frame = (now: number): void => {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now

    if (this.mode === 'play') {
      this.tickPlay(dt)
    } else {
      this.syncEditHelpers()
    }

    this.postFX.render()
    requestAnimationFrame(this.frame)
  }

  private tickPlay(dt: number): void {
    if (this.input.pointerLocked) {
      this.player.update(dt, this.input, this.colliders)
    }

    for (const b of this.behaviours) {
      if (b.enabled && b.gameObject.activeInHierarchy) b.update(dt)
    }
    for (const b of this.behaviours) {
      if (b.enabled && b.gameObject.activeInHierarchy) b.lateUpdate(dt)
    }

    this.crt.update(dt)

    const px = this.player.position.x
    const pz = this.player.position.z
    this.scene.traverse((go) => {
      const tr = go.getComponent(TriggerComponent)
      if (tr?.pollEnter(px, 1, pz)) {
        console.log(`[Trigger] enter ${tr.triggerId}`)
      }
    })

    const near = this.findNearestDoor(px, pz)
    if (near && this.input.pointerLocked) {
      const label =
        near.state === 'locked'
          ? `E — ${near.doorId} (locked)`
          : near.state === 'open'
            ? `E — Close ${near.doorId}`
            : `E — Open ${near.doorId}`
      this.showPrompt(label, 0.15)
    }

    if (this.input.consumeInteract()) {
      const door = this.findNearestDoor(px, pz)
      if (door) {
        const result = door.interact()
        door.syncCollider(this.colliders)
        if (result.message) this.showPrompt(result.message, 2.5)
      }
    }

    if (this.promptTimer > 0) {
      this.promptTimer -= dt
      if (this.promptTimer <= 0) this.promptEl?.classList.remove('visible')
    }

    if (this.debugEl) {
      this.debugEl.textContent =
        `pos ${px.toFixed(1)}, ${pz.toFixed(1)}\n` +
        `state ${this.officeState.current}\n` +
        `mode PLAY`
    }
  }

  private findNearestDoor(px: number, pz: number, range = 2.2): DoorComponent | null {
    let best: DoorComponent | null = null
    let bestDist = range
    this.scene.traverse((go) => {
      const door = go.getComponent(DoorComponent)
      if (!door || !door.enabled) return
      const wp = new THREE.Vector3()
      go.node.getWorldPosition(wp)
      const dist = Math.hypot(wp.x - px, wp.z - pz)
      if (dist < bestDist) {
        bestDist = dist
        best = door
      }
    })
    return best
  }

  private showPrompt(text: string, duration: number): void {
    if (!this.promptEl) return
    this.promptEl.textContent = text
    this.promptEl.classList.add('visible')
    this.promptTimer = duration
  }
}
