import { useEffect, useState } from 'react'
import type { Engine } from '../../engine/Engine'
import type { SceneGameObject } from '../../engine/SceneGameObject'
import { useEngine } from '../EditorContext'
import { dropPlaceFromClientY, hierarchyMove, type DropPlace } from '../hierarchyMove'

const DRAG_MIME = 'application/x-rib-uuid'

type DropTarget = { uuid: string; place: DropPlace }

export function Hierarchy() {
  const engine = useEngine()
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [dragUuid, setDragUuid] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
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

  const clearDrag = (): void => {
    setDragUuid(null)
    setDropTarget(null)
  }

  const applyDrop = (target: SceneGameObject | null, place: DropPlace): void => {
    if (!dragUuid) return
    const src = engine.scene.findByUuid(dragUuid)
    if (!src) return
    if (hierarchyMove(engine, src, target, place)) {
      if (target && place === 'inside') {
        setCollapsed((prev) => {
          if (!prev.has(target.uuid)) return prev
          const next = new Set(prev)
          next.delete(target.uuid)
          return next
        })
      }
      engine.persist()
    }
    clearDrag()
  }

  return (
    <aside id="hierarchy">
      <div className="panel-title">Hierarchy</div>
      <div
        className={`tree-host${dropTarget?.uuid === '__root__' ? ' drop-root' : ''}`}
        onDragOver={(e) => {
          if (!dragUuid) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setDropTarget({ uuid: '__root__', place: 'after' })
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setDropTarget(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          applyDrop(null, 'after')
        }}
      >
        <ul className="tree">
          {engine.scene.roots.map((root) => (
            <TreeItem
              key={root.uuid}
              go={root}
              engine={engine}
              collapsed={collapsed}
              toggle={toggle}
              dragUuid={dragUuid}
              dropTarget={dropTarget}
              setDragUuid={setDragUuid}
              setDropTarget={setDropTarget}
              onDropOn={applyDrop}
              clearDrag={clearDrag}
            />
          ))}
        </ul>
        <div className="tree-root-hint">Drop here to make scene root</div>
      </div>
    </aside>
  )
}

function TreeItem({
  go,
  engine,
  collapsed,
  toggle,
  dragUuid,
  dropTarget,
  setDragUuid,
  setDropTarget,
  onDropOn,
  clearDrag,
}: {
  go: SceneGameObject
  engine: Engine
  collapsed: Set<string>
  toggle: (uuid: string) => void
  dragUuid: string | null
  dropTarget: DropTarget | null
  setDragUuid: (uuid: string | null) => void
  setDropTarget: (v: DropTarget | null) => void
  onDropOn: (target: SceneGameObject, place: DropPlace) => void
  clearDrag: () => void
}) {
  const hasChildren = go.children.length > 0
  const isCollapsed = collapsed.has(go.uuid)
  const isDragSource = dragUuid === go.uuid
  const drop = dropTarget?.uuid === go.uuid ? dropTarget.place : null

  return (
    <li className={hasChildren && isCollapsed ? 'collapsed' : undefined}>
      <div
        className={[
          'row',
          engine.selected?.uuid === go.uuid ? 'selected' : '',
          isDragSource ? 'dragging' : '',
          drop === 'before' ? 'drop-before' : '',
          drop === 'after' ? 'drop-after' : '',
          drop === 'inside' ? 'drop-inside' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-uuid={go.uuid}
        draggable
        onClick={() => engine.select(go)}
        onDoubleClick={(e) => {
          if (!hasChildren) return
          e.preventDefault()
          toggle(go.uuid)
        }}
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_MIME, go.uuid)
          e.dataTransfer.setData('text/plain', go.uuid)
          e.dataTransfer.effectAllowed = 'move'
          setDragUuid(go.uuid)
        }}
        onDragEnd={clearDrag}
        onDragOver={(e) => {
          if (!dragUuid || dragUuid === go.uuid) return
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'move'
          const place = dropPlaceFromClientY(e.currentTarget, e.clientY)
          setDropTarget({ uuid: go.uuid, place })
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          if (dropTarget?.uuid === go.uuid) setDropTarget(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const place = dropTarget?.uuid === go.uuid ? dropTarget.place : dropPlaceFromClientY(e.currentTarget, e.clientY)
          onDropOn(go, place)
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
            <TreeItem
              key={child.uuid}
              go={child}
              engine={engine}
              collapsed={collapsed}
              toggle={toggle}
              dragUuid={dragUuid}
              dropTarget={dropTarget}
              setDragUuid={setDragUuid}
              setDropTarget={setDropTarget}
              onDropOn={onDropOn}
              clearDrag={clearDrag}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
