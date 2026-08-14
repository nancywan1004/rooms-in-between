import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import type { EditorCamera } from './EditorCamera'
import type { SceneGameObject } from '../../engine/SceneGameObject'

export type GizmoMode = 'translate' | 'rotate' | 'scale'
export type GizmoApi = ReturnType<typeof createGizmo>

export function createGizmo(
  camera: THREE.Camera,
  dom: HTMLElement,
  scene: THREE.Scene,
  editorCam: EditorCamera,
  onChange: () => void,
  onDragging?: (dragging: boolean) => void,
): {
  controls: TransformControls
  setTarget: (go: SceneGameObject | null) => void
  setMode: (mode: GizmoMode) => void
  setEnabled: (on: boolean) => void
  dragging: () => boolean
  hovering: () => boolean
} {
  const controls = new TransformControls(camera, dom)
  controls.setSize(0.9)
  const helper = controls.getHelper()
  helper.traverse((obj) => {
    obj.userData.editorOnly = true
  })
  scene.add(helper)

  let dragging = false
  controls.addEventListener('dragging-changed', (e) => {
    dragging = Boolean((e as { value: boolean }).value)
    editorCam.blocked = dragging
    onDragging?.(dragging)
  })
  controls.addEventListener('objectChange', () => onChange())

  return {
    controls,
    setTarget(go) {
      if (go) controls.attach(go.node)
      else controls.detach()
    },
    setMode(mode) {
      controls.setMode(mode)
    },
    setEnabled(on) {
      controls.enabled = on
      controls.getHelper().visible = on && Boolean(controls.object)
      if (!on) editorCam.blocked = false
    },
    dragging: () => dragging,
    hovering: () => Boolean(controls.axis),
  }
}
