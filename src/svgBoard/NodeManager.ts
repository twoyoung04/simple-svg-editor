import { Board } from "./Board"
import { BoardEvent } from "./EventEmitter"
import { Manager } from "./Manager"

// @todo: finish this class
// 暂时没有用的一个类 hhh
export class NodeManager extends Manager {
  constructor(board: Board) {
    super(board)
  }

  public override onMouseDown(e: BoardEvent): void {}
  public override onMouseMove(e: BoardEvent): void {}
  public override onMouseUp(e: BoardEvent): void {}
}
