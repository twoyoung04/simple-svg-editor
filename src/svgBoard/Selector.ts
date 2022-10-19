import { Board } from "./Board";
import { BoardEvent } from "./EventEmitter";
import { NS } from "./namespaces";
import { setAttr } from "./utilities";

// @todo: refractor as a plugin
export class Selector {
  private container: SVGElement;
  private selectorRoot: SVGGElement;
  private selectRect: SVGRectElement;
  private board: Board;
  private selectedRect: SVGRectElement;
  private selectedCorner: SVGGElement;
  constructor(board: Board) {
    this.board = board;
    this.container = board.svgroot;
    this.selectorRoot = board.svgdoc.createElementNS(
      NS.SVG,
      "g"
    ) as SVGGElement;
    this.selectRect = board.svgdoc.createElementNS(
      NS.SVG,
      "rect"
    ) as SVGRectElement;
    this.selectedRect = board.svgdoc.createElementNS(
      NS.SVG,
      "rect"
    ) as SVGRectElement;
    // @todo: 一些初始设置blabla
    setAttr(this.selectRect, {
      fill: "#f00",
      stroke: "#66c",
      "stroke-width": "0.5",
      "fill-opacity": "0.15",
      display: "none",
    });
    setAttr(this.selectedRect, {
      fill: "none",
      stroke: "#009aff",
      "stroke-width": "2",
      "fill-opacity": "0.15",
      display: "none",
    });
    this.selectorRoot.append(this.selectRect);
    this.selectorRoot.append(this.selectedRect);
    this.container.append(this.selectorRoot);

    board.eventEmitter.on("selectStart", this.onSelectStart.bind(this));
    board.eventEmitter.on("selectMove", this.onSelectMove.bind(this));
    board.eventEmitter.on("selectEnd", this.onSelectEnd.bind(this));
    board.eventEmitter.on("elementSelected", this.onElemetSelected.bind(this));
    board.eventEmitter.on("nothingSelected", this.onNothingSelected.bind(this));
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
    const elements = this.board.selection;
    // 获取最大宽高，若一个元素，则取该元素的 BBOX，多个元素则取 AABB 的并集
    if (!elements) return;
    if (elements.length === 1) {
      const { transform, frameWidth, frameHeight } = elements[0];
      let rect = { x: 0, y: 0, width: frameWidth, height: frameHeight };
      setAttr(this.selectedRect, {
        transform: transform.cssString(),
        display: "inline",
        ...rect,
      });
    }
  }

  private onNothingSelected(e: BoardEvent) {
    setAttr(this.selectedRect, {
      display: "none",
    });
  }

  private onElementCreateing(e: BoardEvent) {
    const elements = this.board.selection;
    // 获取最大宽高，若一个元素，则取该元素的 BBOX，多个元素则取 AABB 的并集
    if (!elements) return;
    if (elements.length === 1) {
      const { transform, frameWidth, frameHeight } = elements[0];
      let rect = { x: 0, y: 0, width: frameWidth, height: frameHeight };
      setAttr(this.selectedRect, {
        transform: transform.cssString(),
        display: "inline",
        ...rect,
      });
    }
  }
}
