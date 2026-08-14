import * as THREE from 'three'
import { PREFABS, type PrefabCategory } from '../../engine/prefabs/registry'
import { useEngine } from '../EditorContext'

const LABELS: Record<PrefabCategory, string> = {
  primitive: 'Primitives',
  architecture: 'Architecture',
  furniture: 'Furniture',
  gameplay: 'Gameplay',
}

const GROUPS: PrefabCategory[] = ['primitive', 'architecture', 'furniture', 'gameplay']
const _dir = new THREE.Vector3()

export function Assets() {
  const engine = useEngine()
  if (!engine) return <div id="assets" />

  return (
    <div id="assets">
      <div className="panel-title">Assets</div>
      <div className="asset-groups">
        {GROUPS.map((cat) => (
          <div key={cat} className="asset-group">
            <h4>{LABELS[cat]}</h4>
            <div className="asset-grid">
              {PREFABS.filter((p) => p.category === cat).map((prefab) => (
                <button
                  key={prefab.id}
                  type="button"
                  onClick={() => {
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
                    engine.persist()
                  }}
                >
                  {prefab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
