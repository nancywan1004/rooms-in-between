import type { Engine } from '../../engine/Engine'
import type { SceneGameObject } from '../../engine/SceneGameObject'
import { saveWorkingCopy } from '../../engine/serialize'

export function mountHierarchy(el: HTMLElement, engine: Engine): void {
  const title = document.createElement('div')
  title.className = 'panel-title'
  title.textContent = 'Hierarchy'
  const treeHost = document.createElement('div')
  el.append(title, treeHost)

  const collapsed = new Set<string>()

  const refresh = (): void => {
    treeHost.innerHTML = ''
    const ul = document.createElement('ul')
    ul.className = 'tree'
    for (const root of engine.scene.roots) {
      ul.appendChild(makeItem(root, engine, collapsed))
    }
    treeHost.appendChild(ul)
    revealSelected(treeHost, engine.selected?.uuid)
  }

  engine.onChange(refresh)
  engine.onSelection((go) => {
    if (go) expandAncestors(go, collapsed)
    refresh()
  })
  refresh()
}

function makeItem(go: SceneGameObject, engine: Engine, collapsed: Set<string>): HTMLLIElement {
  const li = document.createElement('li')
  const hasChildren = go.children.length > 0
  const isCollapsed = collapsed.has(go.uuid)
  if (hasChildren && isCollapsed) li.classList.add('collapsed')

  const row = document.createElement('div')
  row.className = 'row'
  row.dataset.uuid = go.uuid
  if (engine.selected?.uuid === go.uuid) row.classList.add('selected')
  row.draggable = true

  const caret = document.createElement('span')
  caret.className = 'caret'
  if (hasChildren) {
    caret.textContent = isCollapsed ? '▸' : '▾'
    caret.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleCollapsed(go.uuid, li, caret, collapsed)
    })
  } else {
    caret.classList.add('empty')
    caret.textContent = ' '
  }

  const eye = document.createElement('span')
  eye.className = 'eye'
  eye.textContent = go.active ? '●' : '○'
  eye.addEventListener('click', (e) => {
    e.stopPropagation()
    go.active = !go.active
    go.node.visible = go.active
    saveWorkingCopy(engine.scene)
    engine.notifyChange()
  })

  const name = document.createElement('span')
  name.className = 'label'
  name.textContent = go.name || '(unnamed)'

  row.append(caret, eye, name)
  row.addEventListener('click', () => engine.select(go))
  row.addEventListener('dblclick', (e) => {
    if (!hasChildren) return
    e.preventDefault()
    toggleCollapsed(go.uuid, li, caret, collapsed)
  })

  row.addEventListener('dragstart', (e) => {
    e.dataTransfer?.setData('text/uuid', go.uuid)
  })
  row.addEventListener('dragover', (e) => {
    e.preventDefault()
  })
  row.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const uuid = e.dataTransfer?.getData('text/uuid')
    if (!uuid || uuid === go.uuid) return
    const src = engine.scene.findByUuid(uuid)
    if (!src || isDescendant(src, go)) return
    if (engine.scene.roots.includes(src)) engine.scene.remove(src)
    go.addChild(src)
    collapsed.delete(go.uuid)
    saveWorkingCopy(engine.scene)
    engine.notifyChange()
  })

  li.appendChild(row)
  if (hasChildren) {
    const ul = document.createElement('ul')
    for (const child of go.children) ul.appendChild(makeItem(child, engine, collapsed))
    li.appendChild(ul)
  }
  return li
}

function toggleCollapsed(
  uuid: string,
  li: HTMLLIElement,
  caret: HTMLElement,
  collapsed: Set<string>,
): void {
  if (collapsed.has(uuid)) collapsed.delete(uuid)
  else collapsed.add(uuid)
  const now = collapsed.has(uuid)
  li.classList.toggle('collapsed', now)
  caret.textContent = now ? '▸' : '▾'
}

function expandAncestors(go: SceneGameObject, collapsed: Set<string>): void {
  let p = go.parent
  while (p) {
    collapsed.delete(p.uuid)
    p = p.parent
  }
}

function revealSelected(host: HTMLElement, uuid: string | undefined): void {
  if (!uuid) return
  const row = host.querySelector<HTMLElement>(`.row[data-uuid="${uuid}"]`)
  row?.scrollIntoView({ block: 'nearest' })
}

function isDescendant(ancestor: SceneGameObject, node: SceneGameObject): boolean {
  let p = node.parent
  while (p) {
    if (p === ancestor) return true
    p = p.parent
  }
  return false
}
