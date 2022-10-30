import { Board, DIRECTION, MouseStatus } from "./Board"
import { BoardEvent } from "./EventEmitter"
import { Log } from "./Log"
import { Manager } from "./Manager"
import { Vector2 } from "./Vector"

export class MouseStatusManager extends Manager {
  private _mouseStatus: MouseStatus
  private _cachedEvent: BoardEvent

  private _cornerType: DIRECTION
  public get cornerType(): DIRECTION {
    return this._cornerType
  }
  public set cornerType(value: DIRECTION) {
    this._cornerType = value
  }

  public get mouseStatus(): MouseStatus {
    return this._mouseStatus
  }
  public set mouseStatus(value: MouseStatus) {
    if (this._mouseStatus === value) return
    // console.log(this._mouseStatus)
    this._mouseStatus = value
    this._cachedEvent.customData.mouseStatus = value
    this.eventEmitter.trigger("mouseStatusChange", [this._cachedEvent])
  }

  constructor(board: Board) {
    super(board)

    this._cachedEvent = new BoardEvent("mouseStatusChange", null)
    this._cachedEvent.customData = {}

    this.eventEmitter.on(
      "mouseStatusChange",
      this.onMouseStatusChange.bind(this)
    )
  }

  public override onMouseDown(e: BoardEvent): void {
    Log.blue("mouse down in MouseStatusManager...")
  }
  public override onMouseMove(e: BoardEvent): void {
    this.updateMouseStatus(e)
  }
  public override onMouseUp(e: BoardEvent): void {}

  private onMouseStatusChange(e: BoardEvent) {
    const { customData } = e
    switch (customData.mouseStatus) {
      default:
      case MouseStatus.DRAG:
        this.board.container.className = ""
        break
      case MouseStatus.ROTATE:
        this.board.container.className = "cursor-rotate"
        break
      case MouseStatus.SCALE:
        this.board.container.className = "cursor-resize"
        break
    }
  }

  private updateMouseStatus(e: BoardEvent) {
    if (!this.board.selection || this.board.selection.length < 1) return false
    let { x, y } = e.customData
    let distances = this.board.selectionArea.nearestCornerDistance(
      new Vector2(x, y)
    )
    let dis = Infinity,
      index = -1
    distances.forEach((d, i) => {
      if (d < dis) {
        dis = d
        index = i
      }
    })
    switch (index) {
      case 0:
        this.cornerType = DIRECTION.LT
        break
      case 1:
        this.cornerType = DIRECTION.LB
        break
      case 2:
        this.cornerType = DIRECTION.RB
        break
      case 3:
        this.cornerType = DIRECTION.RT
        break
    }

    if (dis < 5) {
      this.mouseStatus = MouseStatus.SCALE
    } else if (dis < 10) {
      this.mouseStatus = MouseStatus.ROTATE
      // @todo: finish this
    } else if (false) {
      this.mouseStatus = MouseStatus.DRAG
    } else {
      this.mouseStatus = MouseStatus.SELECT
    }
  }
}
