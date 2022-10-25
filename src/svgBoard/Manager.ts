import { Board } from "./Board"
import { BoardEvent, EventEmitter } from "./EventEmitter"

interface IManager {}

export class Manager implements IManager {
  board: Board
  protected eventEmitter: EventEmitter

  constructor(board: Board) {
    this.board = board
    this.eventEmitter = this.board.eventEmitter

    this.board.eventEmitter.on("mouseDown", this.onMouseDown.bind(this))
    this.board.eventEmitter.on("mouseMove", this.onMouseMove.bind(this))
    this.board.eventEmitter.on("mouseUp", this.onMouseUp.bind(this))
  }

  public onMouseDown(e: BoardEvent) {}
  public onMouseMove(e: BoardEvent) {}
  public onMouseUp(e: BoardEvent) {}
}
