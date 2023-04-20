import { Board, CreateMode, EditorMode } from "./Board"
import { BoardEvent, EventType } from "./EventEmitter"
import { Manager } from "./Manager"
import { isMac } from "./utilities"

export class ShortcutManager extends Manager {
  constructor(board: Board) {
    super(board)

    this.board.eventEmitter.on(EventType.KeyDown, this.OnKeyDown.bind(this))
  }

  public OnKeyDown(e: BoardEvent) {
    let originEvent = e.originEvent as KeyboardEvent
    let isMacOS = isMac()
    console.log('originEvent.key:', originEvent.key);
    switch (originEvent.key) {
      case "r":
        this.board.setMode(EditorMode.CREATE)
        this.board.currentCreateMode = CreateMode.RECT
        break
      case "o":
        this.board.setMode(EditorMode.CREATE)
        this.board.currentCreateMode = CreateMode.ELLIPSE
        break
      case "l":
        this.board.setMode(EditorMode.CREATE)
        this.board.currentCreateMode = CreateMode.LINE
        break
      case "v":
        this.board.setMode(EditorMode.SELECT)
        this.board.currentCreateMode = CreateMode.LINE
        break
      case "z":
        // 需要判断一下平台
        let ctrlOrCmd =
          (isMacOS && originEvent.metaKey) || (!isMacOS && originEvent.ctrlKey)
        if (ctrlOrCmd) {
          if (originEvent.shiftKey) {
            this.board.trigger(EventType.Redo, e)
          } else {
            this.board.trigger(EventType.Undo, e)
          }
        }
        break
    }
  }
}
