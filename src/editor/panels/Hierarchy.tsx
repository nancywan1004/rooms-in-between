import { useEffect, useState } from 'react'
import type { Engine } from '../../engine/Engine'
import type { SceneGameObject } from '../../engine/SceneGameObject'
import { useEngine } from '../EditorContext'

export function Hierarchy() {
  const engine = useEngine()
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const selected = engine?.selected ?? null

  useEffect(() => {
    if (!selected) return
    setCollapsed((prev) => {
      let changed = false
      const next = new Set(prev)
      let p = selected.parent
      while (p) {
        if (next.delete(p.uuid)) changed = true
        p = p.parent
      }
      return changed ? next : prev
    })
  }, [selected])

  useEffect(() => {
    if (!selected) return
    const row = document.querySelector<HTMLElement>(`.tree .row[data-uuid="${selected.uuid}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (!engine) return <aside id="hierarchy" />

  const toggle = (uuid: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) next.delete(uuid)
      else next.add(uuid)
      return next
    })
  }

  return (
    <aside id="hierarchy">
      <div className="panel-title">Hierarchy</div>
      <ul className="tree">
        {engine.scene.roots.map((root) => (
          <TreeItem key={root.uuid} go={root} engine={engine} collapsed={collapsed} toggle={toggle} />
        ))}
      </ul>
    </aside>
  )
}

function TreeItem({
  go,
  engine,
  collapsed,
  toggle,
}: {
  go: SceneGameObject
  engine: Engine
  collapsed: Set<string>
  toggle: (uuid: string) => void
}) {
  const hasChildren = go.children.length > 0
  const isCollapsed = collapsed.has(go.uuid)

  return (
    <li className={hasChildren && isCollapsed ? 'collapsed' : undefined}>
      <div
        className={`row${engine.selected?.uuid === go.uuid ? ' selected' : ''}`}
        data-uuid={go.uuid}
        draggable
        onClick={() => engine.select(go)}
        onDoubleClick={(e) => {
          if (!hasChildren) return
          e.preventDefault()
          toggle(go.uuid)
        }}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/uuid', go.uuid)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const uuid = e.dataTransfer.getData('text/uuid')
          if (!uuid || uuid === go.uuid) return
          const src = engine.scene.findByUuid(uuid)
          if (!src || isDescendant(src, go)) return
          if (engine.scene.roots.includes(src)) engine.scene.remove(src)
          go.addChild(src)
          toggleOpen(toggle, go.uuid, collapsed)
          engine.persist()
        }}
      >
        <span
          className={`caret${hasChildren ? '' : ' empty'}`}
          onClick={(e) => {
            if (!hasChildren) return
            e.stopPropagation()
            toggle(go.uuid)
          }}
        >
          {hasChildren ? (isCollapsed ? '▸' : '▾') : ' '}
        </span>
        <span
          className="eye"
          onClick={(e) => {
            e.stopPropagation()
            go.active = !go.active
            go.node.visible = go.active
            engine.persist()
          }}
        >
          {go.active ? '●' : '○'}
        </span>
        <span className="label">{go.name || '(unnamed)'}</span>
      </div>
      {hasChildren && (
        <ul>
          {go.children.map((child) => (
            <TreeItem key={child.uuid} go={child} engine={engine} collapsed={collapsed} toggle={toggle} />
          ))}
        </ul>
      )}
    </li>
  )
}

function toggleOpen(toggle: (uuid: string) => void, uuid: string, collapsed: Set<string>): void {
  if (collapsed.has(uuid)) toggle(uuid)
}

function isDescendant(ancestor: SceneGameObject, node: SceneGameObject): boolean {
  let p = node.parent
  while (p) {
    if (p === ancestor) return true
    p = p.parent
  }
  return false
}
