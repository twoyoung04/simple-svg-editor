import { BaseElement } from "./BaseElement"
import { Board } from "./Board"
import { BoardEvent, EventType } from "./EventEmitter"
import { Log } from "./Log"
import { Manager } from "./Manager"
import { Transform } from "./Transform"

export class Command {
  public apply() {}
  public unApply() {}
}

export class CreateElementCommand extends Command {}
export class ChangeElementCommand extends Command {
  element: BaseElement
  oldValues: any
  newValues: any
  info: string
  constructor(element: BaseElement, attrs: any, info: string) {
    super()
    this.element = element
    this.oldValues = attrs
    this.newValues = { transform: element.transform.clone() }
    this.info = info ? info : ""
  }

  public apply(): void {
    Object.entries(this.newValues).forEach(([key, value]) => {
      switch (key) {
        case "transform":
          this.element.transform = value as Transform

          break
      }
    })
    this.element.updateRendering()
  }
  public unApply(): void {
    Object.entries(this.oldValues).forEach(([key, value]) => {
      console.log(key, value)
      switch (key) {
        case "transform":
          this.element.transform = value as Transform

          break
      }
    })
    this.element.updateRendering()
  }
}

export class BatchCommand extends Command {
  stack: Command[]
  info: string
  constructor(info) {
    super()
    this.stack = []
    this.info = info ? info : ""
  }

  public apply(): void {
    this.stack.forEach((cmd) => cmd && cmd.apply())
  }
  public unApply(): void {
    console.log(this.stack)
    this.stack.reverse().forEach((cmd) => cmd && cmd.unApply())
  }
  public addSubCommand(cmd: Command) {
    this.stack.push(cmd)
  }
}

type UndoableChange = {
  attr: string
  oldValues: Transform[]
  elements: BaseElement[]
}

export class UndoManager extends Manager {
  undoStackPointer: number
  stack: Command[]
  undoChangeStackPointer: number
  undoableChangeStack: UndoableChange[]
  constructor(board: Board) {
    super(board)

    this.stack = []
    this.undoStackPointer = 0
    this.undoableChangeStack = []
    this.undoChangeStackPointer = -1

    // this.board.on(EventType.DragStart, this.onDragStart.bind(this))
    // this.board.on(EventType.DragEnd, this.onDragEnd.bind(this))
    this.board.on(
      EventType.ElementChangeStart,
      this.onElementChangeStart.bind(this)
    )
    this.board.on(
      EventType.ElementChangeEnd,
      this.onElementChangeEnd.bind(this)
    )
    this.board.on(EventType.Undo, this.onUndo.bind(this))
    this.board.on(EventType.Redo, this.onRedo.bind(this))
  }

  private onElementChangeStart(e: BoardEvent) {
    this.startUndoableChange("transform", this.board.selection)
  }

  private onElementChangeEnd(e: BoardEvent) {
    let batchCmd = this.endUndoableChange()
    if (batchCmd) {
      this.addCommandToHistory(batchCmd)
      console.log(this.stack)
    }
  }

  private onUndo(e: BoardEvent) {
    if (this.undoStackPointer > 0) {
      let cmd = this.stack[--this.undoStackPointer]
      cmd.unApply()
      this.board.trigger(EventType.ElementChanged, e)
    } else {
      Log.Warn("no action to apply undo..")
    }
  }

  private onRedo(e: BoardEvent) {
    // todo: finish this
    console.log("on redo")
    console.log(this.undoStackPointer)
    console.log(this.stack)
    if (this.undoStackPointer < this.stack.length && this.stack.length > 0) {
      const cmd = this.stack[this.undoStackPointer++]
      cmd.apply()
      this.board.trigger(EventType.ElementChanged, e)
    }
  }

  private addCommandToHistory(cmd: Command) {
    if (this.undoStackPointer < this.stack.length && this.stack.length > 0) {
      this.stack = this.stack.splice(0, this.undoStackPointer)
    }
    this.stack.push(cmd)
    this.undoStackPointer = this.stack.length
  }

  private startUndoableChange(attr: string, elements: BaseElement[]) {
    const p = ++this.undoChangeStackPointer
    const oldValues = elements.map((e) => e.transform.clone())
    this.undoableChangeStack[p] = {
      attr,
      oldValues,
      elements,
    }
  }
  private endUndoableChange() {
    const p = this.undoChangeStackPointer--
    const changeset = this.undoableChangeStack[p]
    const { attr, elements } = changeset

    const batchCmd = new BatchCommand("change elements")
    elements.forEach((element, i) => {
      let changes: Partial<UndoableChange> = {}
      changes[attr] = changeset.oldValues[i]
      if (!changes[attr].equal(element.transform)) {
        batchCmd.addSubCommand(new ChangeElementCommand(element, changes, attr))
      }
    })
    this.undoableChangeStack[p] = null
    return batchCmd
  }
}
