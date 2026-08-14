import * as THREE from 'three'
import { PREFABS, type PrefabCategory } from '../../engine/prefabs/registry'
import type { Engine } from '../../engine/Engine'
import { saveWorkingCopy } from '../../engine/serialize'

const LABELS: Record<PrefabCategory, string> = {
  primitive: 'Primitives',
  architecture: 'Architecture',
  furniture: 'Furniture',
  gameplay: 'Gameplay',
}

const _dir = new THREE.Vector3()

export function mountAssets(el: HTMLElement, engine: Engine): void {
  el.innerHTML = ''
  const title = document.createElement('div')
  title.className = 'panel-title'
  title.textContent = 'Assets'
  el.appendChild(title)

  const wrap = document.createElement('div')
  wrap.className = 'asset-groups'
  el.appendChild(wrap)

  const groups: PrefabCategory[] = ['primitive', 'architecture', 'furniture', 'gameplay']
  for (const cat of groups) {
    const group = document.createElement('div')
    group.className = 'asset-group'
    const h = document.createElement('h4')
    h.textContent = LABELS[cat]
    const grid = document.createElement('div')
    grid.className = 'asset-grid'
    for (const prefab of PREFABS.filter((p) => p.category === cat)) {
      const b = document.createElement('button')
      b.textContent = prefab.label
      b.addEventListener('click', () => {
        const go = prefab.spawn()
        const parent = engine.selected
        if (parent) parent.addChild(go)
        else engine.scene.add(go)
        engine.editCamera.getWorldDirection(_dir)
        go.transform.setPosition(
          engine.editCamera.position.x + _dir.x * 4,
          0,
          engine.editCamera.position.z + _dir.z * 4,
        )
        engine.select(go)
        engine.syncEditHelpers()
        saveWorkingCopy(engine.scene)
        engine.notifyChange()
      })
      grid.appendChild(b)
    }
    group.append(h, grid)
    wrap.appendChild(group)
  }
}
