import { Board } from "./Board";
import { Position, Size, WorldPosition } from "./type";


export class Viewport {
  board: Board;
  worldPosition: WorldPosition
  size: Size
  container: HTMLDivElement

  constructor(board: Board) {
    this.board = board;
    this.worldPosition = {x: 0, y: 0};
    this.size = {w: 500, h: 500};

    this.container = document.createElement('div');
    this.container.style.transformOrigin = 'left top';
    this.update()
  }

  get renderArea() {
    const left = (this.worldPosition.x - this.board.worldPosition.x) / this.board.zoom
    const top = (this.worldPosition.y - this.board.worldPosition.y) / this.board.zoom
    return {
      left, top
    }
  }

  update() {
    const {left, top} = this.renderArea;
    this.container.style.transform = `translate(${left}px, ${top}px) scale(${this.board.zoom})`
  }

  getViewPosFromClient(pos: Position) {
    
    return {
      x: pos.x - this.worldPosition.x,
      y: pos.y - this.worldPosition.y
    }
  }

  getPagePosFromClient(pos: Position) {
    const {left, top} = this.renderArea;
    const viewPos = this.getViewPosFromClient(pos);
    const pagePos = {
      x: (viewPos.x - left) / this.board.zoom,
      y: (viewPos.y - top) / this.board.zoom,
    }
    return pagePos;
  }
}