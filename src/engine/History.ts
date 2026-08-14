export type HistoryEntry = {
  json: string
  selected: string | null
}

const LIMIT = 50

/** Snapshot stack. `commit` is called *after* a mutation with the new scene JSON. */
export class History {
  private current: HistoryEntry = { json: '', selected: null }
  private readonly undoStack: HistoryEntry[] = []
  private readonly redoStack: HistoryEntry[] = []
  private coalesceActive = false
  private coalesced = false

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  get coalescing(): boolean {
    return this.coalesceActive
  }

  /** Replace baseline without creating an undo step (initial load). */
  reset(json: string, selected: string | null): void {
    this.current = { json, selected }
    this.undoStack.length = 0
    this.redoStack.length = 0
    this.coalesceActive = false
    this.coalesced = false
  }

  beginCoalesce(): void {
    this.coalesceActive = true
    this.coalesced = false
  }

  endCoalesce(): void {
    this.coalesceActive = false
  }

  commit(json: string, selected: string | null): void {
    if (json === this.current.json && selected === this.current.selected) return
    if (this.coalesceActive) {
      if (!this.coalesced) {
        this.pushUndo(this.current)
        this.redoStack.length = 0
        this.coalesced = true
      }
      this.current = { json, selected }
      return
    }
    this.pushUndo(this.current)
    this.redoStack.length = 0
    this.current = { json, selected }
  }

  undo(): HistoryEntry | null {
    if (!this.undoStack.length) return null
    this.redoStack.push(this.current)
    this.current = this.undoStack.pop()!
    return this.current
  }

  redo(): HistoryEntry | null {
    if (!this.redoStack.length) return null
    this.undoStack.push(this.current)
    this.current = this.redoStack.pop()!
    return this.current
  }

  private pushUndo(entry: HistoryEntry): void {
    this.undoStack.push(entry)
    if (this.undoStack.length > LIMIT) this.undoStack.shift()
  }
}
