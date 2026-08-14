import type { Engine } from '../../engine/Engine'
import { CollisionComponent } from '../../engine/components/CollisionComponent'
import { DoorComponent, type DoorAccent } from '../../engine/components/DoorComponent'
import { LightComponent, type LightKind } from '../../engine/components/LightComponent'
import { RenderComponent } from '../../engine/components/RenderComponent'
import { ScriptComponent } from '../../engine/components/ScriptComponent'
import { TriggerComponent } from '../../engine/components/TriggerComponent'
import { listBehaviours } from '../../engine/Behaviour'
import { saveWorkingCopy } from '../../engine/serialize'
import type { ColliderBox } from '../../world/colliders'
import type { DoorState } from '../../world/doors'

export function mountInspector(el: HTMLElement, engine: Engine): void {
  const title = document.createElement('div')
  title.className = 'panel-title'
  title.textContent = 'Inspector'
  const body = document.createElement('div')
  el.append(title, body)

  const redraw = (): void => {
    body.innerHTML = ''
    const go = engine.selected
    if (!go) {
      body.innerHTML = '<div class="insp-section">No selection</div>'
      return
    }

    const commit = (): void => {
      saveWorkingCopy(engine.scene)
      engine.syncEditHelpers()
      engine.notifyChange()
    }

    body.appendChild(
      section('Object', () => {
        const wrap = document.createElement('div')
        wrap.appendChild(textRow('Name', go.name, (v) => {
          go.name = v
          go.node.name = v
          commit()
        }))
        wrap.appendChild(textRow('Tags', go.tags.join(', '), (v) => {
          go.tags = v.split(',').map((s) => s.trim()).filter(Boolean)
          commit()
        }))
        wrap.appendChild(checkRow('Active', go.active, (v) => {
          go.active = v
          go.node.visible = v
          commit()
        }))
        return wrap
      }),
    )

    const t = go.transform
    body.appendChild(
      section('Transform', () => {
        const wrap = document.createElement('div')
        wrap.appendChild(vec3Row('Pos', [t.position.x, t.position.y, t.position.z], (v) => {
          t.setPosition(v[0], v[1], v[2])
          commit()
        }))
        wrap.appendChild(
          vec3Row(
            'Rot °',
            [rad(t.rotation.x), rad(t.rotation.y), rad(t.rotation.z)],
            (v) => {
              t.setEuler(toRad(v[0]), toRad(v[1]), toRad(v[2]))
              commit()
            },
          ),
        )
        wrap.appendChild(vec3Row('Scale', [t.scale.x, t.scale.y, t.scale.z], (v) => {
          t.setScale(v[0], v[1], v[2])
          commit()
        }))
        return wrap
      }),
    )

    const render = go.getComponent(RenderComponent)
    if (render) {
      body.appendChild(
        section('Render', () => {
          const wrap = document.createElement('div')
          wrap.appendChild(numRow('Color', render.color ?? 0, (v) => {
            render.color = v
            render.applyMaterialOverrides()
            commit()
          }, true))
          wrap.appendChild(numRow('Roughness', render.roughness ?? 0.78, (v) => {
            render.roughness = v
            render.applyMaterialOverrides()
            commit()
          }))
          wrap.appendChild(numRow('Metalness', render.metalness ?? 0.04, (v) => {
            render.metalness = v
            render.applyMaterialOverrides()
            commit()
          }))
          wrap.appendChild(numRow('Opacity', render.opacity ?? 1, (v) => {
            render.opacity = v
            render.applyMaterialOverrides()
            commit()
          }))
          wrap.appendChild(checkRow('Cast Shadow', render.castShadow, (v) => {
            render.castShadow = v
            render.applyShadow()
            commit()
          }))
          return wrap
        }),
      )
    }

    const col = go.getComponent(CollisionComponent)
    if (col) {
      body.appendChild(
        section('Collision', () => {
          const wrap = document.createElement('div')
          wrap.appendChild(
            selectRow(
              'Kind',
              col.kind,
              ['wall', 'desk', 'door', 'furniture', 'cabinet', 'printer'],
              (v) => {
                col.kind = v as ColliderBox['kind']
                commit()
              },
            ),
          )
          wrap.appendChild(vec3Row('Size', col.size, (v) => {
            col.size = v
            commit()
          }))
          wrap.appendChild(vec3Row('Offset', col.offset, (v) => {
            col.offset = v
            commit()
          }))
          wrap.appendChild(checkRow('Enabled', col.enabled, (v) => {
            col.enabled = v
            commit()
          }))
          return wrap
        }),
      )
    }

    const door = go.getComponent(DoorComponent)
    if (door) {
      body.appendChild(
        section('Door', () => {
          const wrap = document.createElement('div')
          wrap.appendChild(textRow('Id', door.doorId, (v) => {
            door.doorId = v
            commit()
          }))
          wrap.appendChild(
            selectRow('State', door.state, ['locked', 'unlocked', 'open', 'closed', 'disabled'], (v) => {
              door.setState(v as DoorState)
              commit()
            }),
          )
          wrap.appendChild(
            selectRow(
              'Accent',
              door.accent,
              ['printer', 'break', 'manager', 'meeting', 'elevator'],
              (v) => {
                door.accent = v as DoorAccent
                door.rebuildVisual()
                commit()
              },
            ),
          )
          return wrap
        }),
      )
    }

    const trigger = go.getComponent(TriggerComponent)
    if (trigger) {
      body.appendChild(
        section('Trigger', () => {
          const wrap = document.createElement('div')
          wrap.appendChild(textRow('Id', trigger.triggerId, (v) => {
            trigger.triggerId = v
            commit()
          }))
          wrap.appendChild(vec3Row('Size', trigger.size, (v) => {
            trigger.size = v
            commit()
          }))
          return wrap
        }),
      )
    }

    const light = go.getComponent(LightComponent)
    if (light) {
      body.appendChild(
        section('Light', () => {
          const wrap = document.createElement('div')
          wrap.appendChild(
            selectRow('Kind', light.kind, ['point', 'ambient', 'directional'], (v) => {
              light.kind = v as LightKind
              light.rebuild()
              commit()
            }),
          )
          wrap.appendChild(numRow('Color', light.color, (v) => {
            light.color = v
            light.rebuild()
            commit()
          }, true))
          wrap.appendChild(numRow('Intensity', light.intensity, (v) => {
            light.intensity = v
            light.rebuild()
            commit()
          }))
          wrap.appendChild(numRow('Distance', light.distance, (v) => {
            light.distance = v
            light.rebuild()
            commit()
          }))
          return wrap
        }),
      )
    }

    const script = go.getComponent(ScriptComponent)
    if (script) {
      body.appendChild(
        section('Script', () => {
          const wrap = document.createElement('div')
          const ids = ['', ...listBehaviours()]
          wrap.appendChild(
            selectRow('Behaviour', script.scriptId, ids, (v) => {
              script.scriptId = v
              commit()
            }),
          )
          wrap.appendChild(textRow('Fields JSON', JSON.stringify(script.fields), (v) => {
            try {
              script.fields = JSON.parse(v) as Record<string, unknown>
              commit()
            } catch {
              /* ignore */
            }
          }))
          return wrap
        }),
      )
    }

    body.appendChild(
      section('Add Component', () => {
        const wrap = document.createElement('div')
        const sel = document.createElement('select')
        for (const [id, label] of [
          ['Collision', 'Collision'],
          ['Script', 'Script'],
          ['Trigger', 'Trigger'],
          ['Light', 'Light'],
          ['Door', 'Door'],
        ] as const) {
          const opt = document.createElement('option')
          opt.value = id
          opt.textContent = label
          sel.appendChild(opt)
        }
        const add = document.createElement('button')
        add.textContent = 'Add'
        add.addEventListener('click', () => {
          if (sel.value === 'Collision') go.addComponent(CollisionComponent)
          if (sel.value === 'Script') go.addComponent(ScriptComponent)
          if (sel.value === 'Trigger') go.addComponent(TriggerComponent)
          if (sel.value === 'Light') {
            const c = go.addComponent(LightComponent)
            c.rebuild()
          }
          if (sel.value === 'Door') {
            const c = go.addComponent(DoorComponent)
            c.rebuildVisual()
          }
          commit()
          redraw()
        })
        wrap.append(sel, add)
        return wrap
      }),
    )
  }

  engine.onSelection(redraw)
  redraw()
}

function section(title: string, build: () => HTMLElement): HTMLElement {
  const s = document.createElement('div')
  s.className = 'insp-section'
  const h = document.createElement('h3')
  h.textContent = title
  s.append(h, build())
  return s
}

function textRow(label: string, value: string, onChange: (v: string) => void): HTMLElement {
  const row = document.createElement('div')
  row.className = 'insp-row'
  const l = document.createElement('label')
  l.textContent = label
  const input = document.createElement('input')
  input.type = 'text'
  input.value = value
  input.addEventListener('change', () => onChange(input.value))
  row.append(l, input)
  return row
}

function checkRow(label: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
  const row = document.createElement('div')
  row.className = 'insp-row'
  const l = document.createElement('label')
  l.textContent = label
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.checked = value
  input.addEventListener('change', () => onChange(input.checked))
  row.append(l, input)
  return row
}

function numRow(label: string, value: number, onChange: (v: number) => void, hex = false): HTMLElement {
  const row = document.createElement('div')
  row.className = 'insp-row'
  const l = document.createElement('label')
  l.textContent = label
  const input = document.createElement('input')
  input.type = 'number'
  input.step = hex ? '1' : '0.01'
  input.value = String(value)
  input.addEventListener('change', () => onChange(Number(input.value)))
  row.append(l, input)
  return row
}

function vec3Row(label: string, value: [number, number, number], onChange: (v: [number, number, number]) => void): HTMLElement {
  const row = document.createElement('div')
  row.className = 'insp-row'
  const l = document.createElement('label')
  l.textContent = label
  const box = document.createElement('div')
  box.className = 'vec3'
  const inputs = value.map((n) => {
    const input = document.createElement('input')
    input.type = 'number'
    input.step = '0.01'
    input.value = String(Number(n.toFixed(3)))
    box.appendChild(input)
    return input
  })
  const fire = (): void => {
    onChange([Number(inputs[0].value), Number(inputs[1].value), Number(inputs[2].value)])
  }
  inputs.forEach((i) => i.addEventListener('change', fire))
  row.append(l, box)
  return row
}

function selectRow(label: string, value: string, options: string[], onChange: (v: string) => void): HTMLElement {
  const row = document.createElement('div')
  row.className = 'insp-row'
  const l = document.createElement('label')
  l.textContent = label
  const sel = document.createElement('select')
  for (const opt of options) {
    const o = document.createElement('option')
    o.value = opt
    o.textContent = opt || '(none)'
    if (opt === value) o.selected = true
    sel.appendChild(o)
  }
  sel.addEventListener('change', () => onChange(sel.value))
  row.append(l, sel)
  return row
}

function rad(r: number): number {
  return (r * 180) / Math.PI
}

function toRad(d: number): number {
  return (d * Math.PI) / 180
}
