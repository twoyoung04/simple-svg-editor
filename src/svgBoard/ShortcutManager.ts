import { Board, CreateMode, EditorMode } from "./Board"
import { BoardEvent, EventType } from "./EventEmitter"
import { Manager } from "./Manager"

export class ShortcutManager extends Manager {
  constructor(board: Board) {
    super(board)

    this.board.eventEmitter.on(EventType.KeyDown, this.OnKeyDown.bind(this))
  }

  public OnKeyDown(e: BoardEvent) {
    switch ((e.originEvent as KeyboardEvent).key) {
      case "r":
        this.board.setMode(EditorMode.CREATE)
        console.log("---------")
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
    }
  }
}
