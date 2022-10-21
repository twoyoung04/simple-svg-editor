import { Board } from "./Board"
import { BoardEvent } from "./EventEmitter"
import { Log } from "./Log"
import { NS } from "./namespaces"
import { Transform } from "./Transform"
import { setAttr } from "./utilities"

// @todo: refractor as a plugin
export class Selector {
  private container: SVGElement
  private selectorRoot: SVGGElement
  private selectRect: SVGRectElement
  private board: Board
  private selectedRect: SVGRectElement
  private selectedCorner: SVGGElement

  private selectorTransform: Transform
  constructor(board: Board) {
    this.board = board
    this.container = board.svgroot
    this.selectorRoot = board.svgdoc.createElementNS(NS.SVG, "g") as SVGGElement
    this.selectRect = board.svgdoc.createElementNS(
      NS.SVG,
      "rect"
    ) as SVGRectElement
    this.selectedRect = board.svgdoc.createElementNS(
      NS.SVG,
      "rect"
    ) as SVGRectElement
    // @todo: 一些初始设置blabla
    setAttr(this.selectRect, {
      fill: "#f00",
      stroke: "#66c",
      "stroke-width": "0.5",
      "fill-opacity": "0.15",
      display: "none",
    })
    setAttr(this.selectedRect, {
      fill: "none",
      stroke: "#009aff",
      "stroke-width": "2.5",
      "fill-opacity": "0.15",
      display: "none",
    })
    this.selectorRoot.append(this.selectRect)
    this.selectorRoot.append(this.selectedRect)
    this.container.append(this.selectorRoot)

    board.eventEmitter.on("selectStart", this.onSelectStart.bind(this))
    board.eventEmitter.on("selectMove", this.onSelectMove.bind(this))
    board.eventEmitter.on("selectEnd", this.onSelectEnd.bind(this))
    board.eventEmitter.on("elementSelected", this.onElemetSelected.bind(this))
    board.eventEmitter.on("nothingSelected", this.onNothingSelected.bind(this))
    board.eventEmitter.on("draging", this.onDraging.bind(this))
    board.eventEmitter.on("rotating", this.onRotating.bind(this))
    board.eventEmitter.on("scaling", this.onScaling.bind(this))
  }

  private onSelectStart(e) {}

  private onSelectMove(e) {
    setAttr(this.selectRect, {
      display: "inline",
      x: Math.min(e.customData.startX, e.customData.endX),
      y: Math.min(e.customData.startY, e.customData.endY),
      width: Math.abs(e.customData.endX - e.customData.startX),
      height: Math.abs(e.customData.endY - e.customData.startY),
    })
  }
  private onSelectEnd(e: BoardEvent) {
    this.selectRect.setAttribute("display", "none")
    this.selectRect.setAttribute("width", "0")
    this.selectRect.setAttribute("height", "0")
  }

  // @todo: drag 时更新选择框

  private onElemetSelected(e: BoardEvent) {
    const elements = this.board.selection
    const area = e.customData.area
    // 获取最大宽高，若一个元素，则取该元素的 BBOX，多个元素则取 AABB 的并集
    if (!elements) return
    if (elements.length === 1) {
      const { transform, frameWidth, frameHeight } = elements[0]
      this.selectorTransform = transform.clone()
      let rect = { x: 0, y: 0, width: frameWidth, height: frameHeight }
      setAttr(this.selectedRect, {
        transform: transform.cssString(),
        display: "inline",
        ...rect,
      })
    } else {
      // console.log(elements.map((n) => n.AABB));
    }
  }

  private onNothingSelected(e: BoardEvent) {
    setAttr(this.selectedRect, {
      display: "none",
    })
  }

  private onDragStart(e: BoardEvent) {}

  private onDraging(e: BoardEvent) {
    // @todo: 应该把其中的逻辑抽取出来调用，不该直接调用回调
    this.onElemetSelected(e)
  }

  private onRotating(e: BoardEvent) {
    // @todo: 应该把其中的逻辑抽取出来调用，不该直接调用回调
    this.updateRender()
  }

  private onScaling(e: BoardEvent) {
    // @todo: 应该把其中的逻辑抽取出来调用，不该直接调用回调
    this.updateRender()
  }

  private onElementCreateing(e: BoardEvent) {
    const elements = this.board.selection
    // 获取最大宽高，若一个元素，则取该元素的 BBOX，多个元素则取 AABB 的并集
    if (!elements) return
    if (elements.length === 1) {
      const { transform, frameWidth, frameHeight } = elements[0]
      let rect = { x: 0, y: 0, width: frameWidth, height: frameHeight }
      setAttr(this.selectedRect, {
        transform: transform.cssString(),
        display: "inline",
        ...rect,
      })
    }
  }

  private updateSelector() {}

  private updateRender() {
    const elements = this.board.selection
    // 获取最大宽高，若一个元素，则取该元素的 BBOX，多个元素则取 AABB 的并集
    if (!elements) return
    if (elements.length === 1) {
      const { transform, frameWidth, frameHeight } = elements[0]
      setAttr(this.selectedRect, {
        transform: transform.cssString(),
        display: "inline",
      })
    }
  }
}
