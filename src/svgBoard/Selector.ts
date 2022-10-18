import { Board } from "./Board";
import { BoardEvent } from "./EventEmitter";
import { NS } from "./namespaces";
import { setAttr } from "./utilities";

export class Selector {
  private container: SVGElement;
  private selectorRoot: Element;
  private selectRect: Element;
  private board: Board;
  constructor(board: Board) {
    this.board = board;
    this.container = board.svgroot;
    // this.selectorRoot = board.svgdoc.createElement("g");
    this.selectRect = board.svgdoc.createElementNS(
      NS.SVG,
      "rect"
    ) as SVGRectElement;
    // @todo: 一些初始设置blabla
    this.selectRect.setAttribute("fill", "#f00");
    this.selectRect.setAttribute("stroke", "#66c");
    this.selectRect.setAttribute("stroke-width", "0.5");
    this.selectRect.setAttribute("fill-opacity", "0.15");
    this.selectRect.setAttribute("display", "none");
    // this.selectorRoot.append(this.selectRect);
    this.container.append(this.selectRect);

    board.eventEmitter.on("selectStart", this.onSelectStart.bind(this));
    board.eventEmitter.on("selectMove", this.onSelectMove.bind(this));
    board.eventEmitter.on("selectEnd", this.onSelectEnd.bind(this));
    board.eventEmitter.on("elementSelected", this.onElemetSelected.bind(this));
  }

  private onSelectStart(e) {}

  private onSelectMove(e) {
    setAttr(this.selectRect, {
      display: "inline",
      x: Math.min(e.customData.startX, e.customData.endX),
      y: Math.min(e.customData.startY, e.customData.endY),
      width: Math.abs(e.customData.endX - e.customData.startX),
      height: Math.abs(e.customData.endY - e.customData.startY),
    });
  }
  private onSelectEnd(e: BoardEvent) {
    this.selectRect.setAttribute("display", "none");
    this.selectRect.setAttribute("width", "0");
    this.selectRect.setAttribute("height", "0");
  }

  private onElemetSelected(e: BoardEvent) {
    const element = this.board.selected;
    console.log("------");
    console.log(element);
  }
}
