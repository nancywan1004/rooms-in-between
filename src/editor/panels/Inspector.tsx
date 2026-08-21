import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Engine } from '../../engine/Engine'
import type { SceneGameObject } from '../../engine/SceneGameObject'
import { listBehaviours } from '../../engine/Behaviour'
import { CollisionComponent } from '../../engine/components/CollisionComponent'
import { DoorComponent, type DoorAccent } from '../../engine/components/DoorComponent'
import { LightComponent, type LightKind } from '../../engine/components/LightComponent'
import { RenderComponent } from '../../engine/components/RenderComponent'
import { ScriptComponent } from '../../engine/components/ScriptComponent'
import { TriggerComponent } from '../../engine/components/TriggerComponent'
import type { ColliderBox } from '../../world/colliders'
import type { DoorState } from '../../world/doors'
import { useEngine } from '../EditorContext'

const COLLIDER_KINDS: ColliderBox['kind'][] = ['wall', 'desk', 'door', 'furniture', 'cabinet', 'printer']
const DOOR_STATES: DoorState[] = ['locked', 'unlocked', 'open', 'closed', 'disabled']
const DOOR_ACCENTS: DoorAccent[] = ['printer', 'break', 'manager', 'meeting', 'elevator']
const LIGHT_KINDS: LightKind[] = ['point', 'ambient', 'directional']
const ADDABLE = ['Collision', 'Script', 'Trigger', 'Light', 'Door'] as const

function collectSceneLights(engine: Engine): { go: SceneGameObject; light: LightComponent }[] {
  const out: { go: SceneGameObject; light: LightComponent }[] = []
  engine.scene.traverse((go) => {
    const light = go.getComponent(LightComponent)
    if (light) out.push({ go, light })
  })
  return out
}

export function Inspector() {
  const engine = useEngine()
  const go = engine?.selected ?? null
  const [addKind, setAddKind] = useState<(typeof ADDABLE)[number]>('Collision')

  if (!engine) return <aside id="inspector" />

  const commit = (): void => {
    engine.persist()
  }

  const sceneLights = collectSceneLights(engine)

  return (
    <aside id="inspector">
      <div className="panel-title">Inspector</div>
      <SceneLightingSection engine={engine} lights={sceneLights} commit={commit} />
      {!go && <div className="insp-section">No selection</div>}
      {go && (
        <>
          <Section title="Object">
            <TextField
              label="Name"
              value={go.name}
              onCommit={(v) => {
                go.name = v
                go.node.name = v
                commit()
              }}
            />
            <TextField
              label="Tags"
              value={go.tags.join(', ')}
              onCommit={(v) => {
                go.tags = v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                commit()
              }}
            />
            <CheckField
              label="Active"
              value={go.active}
              onCommit={(v) => {
                go.active = v
                go.node.visible = v
                commit()
              }}
            />
          </Section>
          <Section title="Transform">
            <Vec3Field
              label="Pos"
              value={[go.transform.position.x, go.transform.position.y, go.transform.position.z]}
              onCommit={(v) => {
                go.transform.setPosition(v[0], v[1], v[2])
                commit()
              }}
            />
            <Vec3Field
              label="Rot °"
              value={[rad(go.transform.rotation.x), rad(go.transform.rotation.y), rad(go.transform.rotation.z)]}
              onCommit={(v) => {
                go.transform.setEuler(toRad(v[0]), toRad(v[1]), toRad(v[2]))
                commit()
              }}
            />
            <Vec3Field
              label="Scale"
              value={[go.transform.scale.x, go.transform.scale.y, go.transform.scale.z]}
              onCommit={(v) => {
                go.transform.setScale(v[0], v[1], v[2])
                commit()
              }}
            />
          </Section>
          {go.getComponent(RenderComponent) && (
            <RenderSection render={go.getComponent(RenderComponent)!} commit={commit} />
          )}
          {go.getComponent(CollisionComponent) && (
            <CollisionSection col={go.getComponent(CollisionComponent)!} commit={commit} />
          )}
          {go.getComponent(DoorComponent) && <DoorSection door={go.getComponent(DoorComponent)!} commit={commit} />}
          {go.getComponent(TriggerComponent) && (
            <TriggerSection trigger={go.getComponent(TriggerComponent)!} commit={commit} />
          )}
          {go.getComponent(LightComponent) && <LightSection light={go.getComponent(LightComponent)!} commit={commit} />}
          {go.getComponent(ScriptComponent) && (
            <ScriptSection script={go.getComponent(ScriptComponent)!} commit={commit} />
          )}
          <Section title="Add Component">
            <div className="insp-row">
              <select value={addKind} onChange={(e) => setAddKind(e.target.value as (typeof ADDABLE)[number])}>
                {ADDABLE.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (addKind === 'Collision') go.addComponent(CollisionComponent)
                  if (addKind === 'Script') go.addComponent(ScriptComponent)
                  if (addKind === 'Trigger') go.addComponent(TriggerComponent)
                  if (addKind === 'Light') go.addComponent(LightComponent).rebuild()
                  if (addKind === 'Door') go.addComponent(DoorComponent).rebuildVisual()
                  commit()
                }}
              >
                Add
              </button>
            </div>
          </Section>
        </>
      )}
    </aside>
  )
}

function SceneLightingSection({
  engine,
  lights,
  commit,
}: {
  engine: Engine
  lights: { go: SceneGameObject; light: LightComponent }[]
  commit: () => void
}) {
  const refresh = (): void => {
    engine.notifyChange()
  }

  return (
    <>
      <Section title="Scene Lighting">
        <NumField
          label="Hemi"
          value={engine.hemi.intensity}
          onCommit={(v) => {
            engine.hemi.intensity = v
            refresh()
          }}
        />
        <ColorField
          label="Hemi Sky"
          value={engine.hemi.color.getHex()}
          onCommit={(v) => {
            engine.hemi.color.setHex(v)
            refresh()
          }}
        />
        <ColorField
          label="Ground"
          value={engine.hemi.groundColor.getHex()}
          onCommit={(v) => {
            engine.hemi.groundColor.setHex(v)
            refresh()
          }}
        />
        <NumField
          label="Sun"
          value={engine.sun.intensity}
          onCommit={(v) => {
            engine.sun.intensity = v
            refresh()
          }}
        />
        <ColorField
          label="Sun Color"
          value={engine.sun.color.getHex()}
          onCommit={(v) => {
            engine.sun.color.setHex(v)
            refresh()
          }}
        />
        <Vec3Field
          label="Sun Pos"
          value={[engine.sun.position.x, engine.sun.position.y, engine.sun.position.z]}
          onCommit={(v) => {
            engine.sun.position.set(v[0], v[1], v[2])
            refresh()
          }}
        />
        <NumField
          label="Exposure"
          value={engine.renderer.toneMappingExposure}
          onCommit={(v) => {
            engine.renderer.toneMappingExposure = v
            refresh()
          }}
        />
      </Section>
      <Section title={`Lights (${lights.length})`}>
        {lights.length === 0 && <div style={{ opacity: 0.55 }}>No Light components in scene</div>}
        {lights.map(({ go, light }) => {
          const selected = engine.selected?.uuid === go.uuid
          return (
            <div key={go.uuid} className={`light-row${selected ? ' selected' : ''}`}>
              <button type="button" className="light-pick" onClick={() => engine.select(go)} title="Select in hierarchy">
                <span className="light-name">{go.name || '(light)'}</span>
                <span className="light-kind">{light.kind}</span>
              </button>
              <CheckField
                label="On"
                value={light.enabled}
                onCommit={(v) => {
                  light.enabled = v
                  light.applyLive()
                  commit()
                }}
              />
              <NumField
                label="Int"
                value={light.intensity}
                onCommit={(v) => {
                  light.intensity = v
                  light.applyLive()
                  commit()
                }}
              />
              <ColorField
                label="Color"
                value={light.color}
                onCommit={(v) => {
                  light.color = v
                  light.applyLive()
                  commit()
                }}
              />
              {light.kind === 'point' && (
                <NumField
                  label="Dist"
                  value={light.distance}
                  onCommit={(v) => {
                    light.distance = v
                    light.applyLive()
                    commit()
                  }}
                />
              )}
            </div>
          )
        })}
      </Section>
    </>
  )
}

function RenderSection({ render, commit }: { render: RenderComponent; commit: () => void }) {
  return (
    <Section title="Render">
      <ColorField
        label="Color"
        value={render.color ?? 0}
        onCommit={(v) => {
          render.color = v
          render.applyMaterialOverrides()
          commit()
        }}
      />
      <NumField
        label="Roughness"
        value={render.roughness ?? 0.78}
        onCommit={(v) => {
          render.roughness = v
          render.applyMaterialOverrides()
          commit()
        }}
      />
      <NumField
        label="Metalness"
        value={render.metalness ?? 0.04}
        onCommit={(v) => {
          render.metalness = v
          render.applyMaterialOverrides()
          commit()
        }}
      />
      <NumField
        label="Opacity"
        value={render.opacity ?? 1}
        onCommit={(v) => {
          render.opacity = v
          render.applyMaterialOverrides()
          commit()
        }}
      />
      <CheckField
        label="Cast Shadow"
        value={render.castShadow}
        onCommit={(v) => {
          render.castShadow = v
          render.applyShadow()
          commit()
        }}
      />
    </Section>
  )
}

function CollisionSection({ col, commit }: { col: CollisionComponent; commit: () => void }) {
  return (
    <Section title="Collision">
      <SelectField
        label="Kind"
        value={col.kind}
        options={COLLIDER_KINDS}
        onCommit={(v) => {
          col.kind = v as ColliderBox['kind']
          commit()
        }}
      />
      <Vec3Field
        label="Size"
        value={col.size}
        onCommit={(v) => {
          col.size = v
          commit()
        }}
      />
      <Vec3Field
        label="Offset"
        value={col.offset}
        onCommit={(v) => {
          col.offset = v
          commit()
        }}
      />
      <CheckField
        label="Enabled"
        value={col.enabled}
        onCommit={(v) => {
          col.enabled = v
          commit()
        }}
      />
    </Section>
  )
}

function DoorSection({ door, commit }: { door: DoorComponent; commit: () => void }) {
  return (
    <Section title="Door">
      <TextField
        label="Id"
        value={door.doorId}
        onCommit={(v) => {
          door.doorId = v
          commit()
        }}
      />
      <SelectField
        label="State"
        value={door.state}
        options={DOOR_STATES}
        onCommit={(v) => {
          door.setState(v as DoorState)
          commit()
        }}
      />
      <SelectField
        label="Accent"
        value={door.accent}
        options={DOOR_ACCENTS}
        onCommit={(v) => {
          door.accent = v as DoorAccent
          door.rebuildVisual()
          commit()
        }}
      />
    </Section>
  )
}

function TriggerSection({ trigger, commit }: { trigger: TriggerComponent; commit: () => void }) {
  return (
    <Section title="Trigger">
      <TextField
        label="Id"
        value={trigger.triggerId}
        onCommit={(v) => {
          trigger.triggerId = v
          commit()
        }}
      />
      <Vec3Field
        label="Size"
        value={trigger.size}
        onCommit={(v) => {
          trigger.size = v
          commit()
        }}
      />
    </Section>
  )
}

function LightSection({ light, commit }: { light: LightComponent; commit: () => void }) {
  return (
    <Section title="Light">
      <SelectField
        label="Kind"
        value={light.kind}
        options={LIGHT_KINDS}
        onCommit={(v) => {
          light.kind = v as LightKind
          light.rebuild()
          commit()
        }}
      />
      <ColorField
        label="Color"
        value={light.color}
        onCommit={(v) => {
          light.color = v
          light.applyLive()
          commit()
        }}
      />
      <NumField
        label="Intensity"
        value={light.intensity}
        onCommit={(v) => {
          light.intensity = v
          light.applyLive()
          commit()
        }}
      />
      <NumField
        label="Distance"
        value={light.distance}
        onCommit={(v) => {
          light.distance = v
          light.applyLive()
          commit()
        }}
      />
      <CheckField
        label="Enabled"
        value={light.enabled}
        onCommit={(v) => {
          light.enabled = v
          light.applyLive()
          commit()
        }}
      />
    </Section>
  )
}

function ScriptSection({ script, commit }: { script: ScriptComponent; commit: () => void }) {
  return (
    <Section title="Script">
      <SelectField
        label="Behaviour"
        value={script.scriptId}
        options={['', ...listBehaviours()]}
        onCommit={(v) => {
          script.scriptId = v
          commit()
        }}
      />
      <TextField
        label="Fields JSON"
        value={JSON.stringify(script.fields)}
        onCommit={(v) => {
          try {
            script.fields = JSON.parse(v) as Record<string, unknown>
            commit()
          } catch {
            /* ignore invalid json */
          }
        }}
      />
    </Section>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="insp-section">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function TextField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: string
  onCommit: (v: string) => void
}) {
  const [text, setText] = useState(value)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(value)
  }, [value])
  return (
    <div className="insp-row">
      <label>{label}</label>
      <input
        type="text"
        value={text}
        onFocus={() => {
          focused.current = true
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          focused.current = false
          onCommit(text)
        }}
        onKeyDown={blurOnEnter}
      />
    </div>
  )
}

function CheckField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: boolean
  onCommit: (v: boolean) => void
}) {
  return (
    <div className="insp-row">
      <label>{label}</label>
      <input type="checkbox" checked={value} onChange={(e) => onCommit(e.target.checked)} />
    </div>
  )
}

function toHexColor(n: number): string {
  const v = Math.max(0, Math.min(0xffffff, Math.round(n))) >>> 0
  return `#${v.toString(16).padStart(6, '0')}`
}

function fromHexColor(hex: string): number {
  const cleaned = hex.replace('#', '')
  const n = Number.parseInt(cleaned, 16)
  return Number.isFinite(n) ? n : 0
}

function ColorField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: number
  onCommit: (v: number) => void
}) {
  const hex = toHexColor(value)
  return (
    <div className="insp-row">
      <label>{label}</label>
      <div className="color-field">
        <input
          type="color"
          value={hex}
          onChange={(e) => onCommit(fromHexColor(e.target.value))}
          title={hex}
        />
        <span className="color-hex">{hex}</span>
      </div>
    </div>
  )
}

function NumField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: number
  onCommit: (v: number) => void
}) {
  const [text, setText] = useState(String(value))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(String(value))
  }, [value])
  const commit = (): void => {
    const n = Number(text)
    if (Number.isFinite(n)) onCommit(n)
    else setText(String(value))
  }
  return (
    <div className="insp-row">
      <label>{label}</label>
      <input
        type="number"
        step="0.01"
        value={text}
        onFocus={() => {
          focused.current = true
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          focused.current = false
          commit()
        }}
        onKeyDown={blurOnEnter}
      />
    </div>
  )
}

function Vec3Field({
  label,
  value,
  onCommit,
}: {
  label: string
  value: [number, number, number]
  onCommit: (v: [number, number, number]) => void
}) {
  const shown = value.map((n) => String(Number(n.toFixed(3)))) as [string, string, string]
  const [text, setText] = useState<[string, string, string]>(shown)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(shown)
  }, [shown[0], shown[1], shown[2]])
  const commit = (): void => {
    onCommit([Number(text[0]), Number(text[1]), Number(text[2])])
  }
  return (
    <div className="insp-row">
      <label>{label}</label>
      <div className="vec3">
        {text.map((t, i) => (
          <input
            key={i}
            type="number"
            step="0.01"
            value={t}
            onFocus={() => {
              focused.current = true
            }}
            onChange={(e) => {
              const next: [string, string, string] = [text[0], text[1], text[2]]
              next[i] = e.target.value
              setText(next)
            }}
            onBlur={() => {
              focused.current = false
              commit()
            }}
            onKeyDown={blurOnEnter}
          />
        ))}
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onCommit,
}: {
  label: string
  value: string
  options: string[]
  onCommit: (v: string) => void
}) {
  return (
    <div className="insp-row">
      <label>{label}</label>
      <select value={value} onChange={(e) => onCommit(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt || '(none)'}
          </option>
        ))}
      </select>
    </div>
  )
}

function blurOnEnter(e: KeyboardEvent<HTMLInputElement>): void {
  if (e.key === 'Enter') e.currentTarget.blur()
}

function rad(r: number): number {
  return (r * 180) / Math.PI
}

function toRad(d: number): number {
  return (d * Math.PI) / 180
}
