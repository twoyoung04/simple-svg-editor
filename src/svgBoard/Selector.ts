import { Board } from "./Board"
import { BoardEvent } from "./EventEmitter"
import { Log } from "./Log"
import { Manager } from "./Manager"
import { NS } from "./namespaces"
import { Transform } from "./Transform"
import { setAttr } from "./utilities"
import { Vector2 } from "./Vector"

// @todo: refractor as a plugin
export class Selector extends Manager {
  private container: SVGElement
  private selectorRoot: SVGGElement
  private selectRect: SVGRectElement
  private selectedRectMap: Map<string, SVGPathElement>
  private selectedCorner: SVGGElement

  private selectorTransform: Transform
  constructor(board: Board) {
    super(board)
    this.board = board
    this.container = board.svgroot
    this.selectorRoot = board.svgdoc.createElementNS(NS.SVG, "g") as SVGGElement
    this.selectRect = board.svgdoc.createElementNS(
      NS.SVG,
      "rect"
    ) as SVGRectElement
    this.selectedRectMap = new Map()
    // @todo: 一些初始设置blabla
    setAttr(this.selectRect, {
      fill: "#f00",
      stroke: "#66c",
      "stroke-width": "0.5",
      "fill-opacity": "0.15",
      display: "none",
    })
    this.selectorRoot.append(this.selectRect)
    this.container.append(this.selectorRoot)

    board.eventEmitter.on("selectStart", this.onSelectStart.bind(this))
    board.eventEmitter.on("selectMove", this.onSelectMove.bind(this))
    board.eventEmitter.on("selectEnd", this.onSelectEnd.bind(this))
    board.eventEmitter.on("elementSelected", this.onElemetSelected.bind(this))
    board.eventEmitter.on("nothingSelected", this.onNothingSelected.bind(this))

    board.eventEmitter.on("creating", this.onCreating.bind(this))
    board.eventEmitter.on("draging", this.onDraging.bind(this))
    board.eventEmitter.on("rotating", this.onRotating.bind(this))
    board.eventEmitter.on("scaling", this.onScaling.bind(this))
  }

  private onSelectStart(e) {
    setAttr(this.selectRect, { display: "inline" })
  }

  private onSelectMove(e) {
    setAttr(this.selectRect, {
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

  private onElemetSelected(e: BoardEvent) {
    this.clear()
    const elements = this.board.selection
    const area = e.customData.area
    // 获取最大宽高，若一个元素，则取该元素的 BBOX，多个元素则取 AABB 的并集
    if (!elements) return
    if (elements.length === 1) {
      const { transform, frameWidth, frameHeight } = elements[0]
      if (!this.selectedRectMap.has(elements[0].id)) {
        let ele = this.board.svgdoc.createElementNS(
          NS.SVG,
          "path"
        ) as SVGPathElement
        this.selectedRectMap.set(elements[0].id, ele)
        this.selectorRoot.append(ele)
        setAttr(ele, {
          fill: "none",
          stroke: "#009aff",
          "stroke-width": "2.5",
          "fill-opacity": "0.15",
          display: "none",
        })
      }
      // 计算 path 各个点，并导出成字符串
      let ps = [
        Vector2.zeros(),
        new Vector2(0, 1),
        Vector2.ones(),
        new Vector2(1, 0),
      ]
      ps.forEach((p) => p.applyTransform(transform))
      let pathStr = "M" + ps.map((p) => p.x + "," + p.y).join("L") + "Z"
      setAttr(this.selectedRectMap.get(elements[0].id), {
        display: "inline",
        d: pathStr,
      })
      // this.selectorTransform = transform.clone()
      // let rect = { x: 0, y: 0, width: 1, height: 1 }
      // setAttr(this.selectedRectMap[elements[0].id], {
      //   transform: transform.cssString(),
      //   // display: "inline",
      //   ...rect,
      // })
    } else {
      // console.log(elements.map((n) => n.AABB));
    }
  }

  private onNothingSelected(e: BoardEvent) {
    this.selectedRectMap.forEach((ele) => setAttr(ele, { display: "none" }))
  }

  private onDragStart(e: BoardEvent) {}

  private onCreateStart(e: BoardEvent) {}

  private onCreating(e: BoardEvent) {
    this.onElemetSelected(e)
  }

  private onDraging(e: BoardEvent) {
    this.onElemetSelected(e)
  }

  private onRotating(e: BoardEvent) {
    this.updateRender()
  }

  private onScaling(e: BoardEvent) {
    this.updateRender()
  }

  private onElementCreateing(e: BoardEvent) {
    const elements = this.board.selection
    // 获取最大宽高，若一个元素，则取该元素的 BBOX，多个元素则取 AABB 的并集
    if (!elements) return
    if (elements.length === 1) {
      const { transform, frameWidth, frameHeight } = elements[0]
      let rect = { x: 0, y: 0, width: frameWidth, height: frameHeight }
      setAttr(this.selectedRectMap.get(elements[0].id), {
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
      const { transform } = elements[0]
      let ps = [
        Vector2.zeros(),
        new Vector2(0, 1),
        Vector2.ones(),
        new Vector2(1, 0),
      ]
      ps.forEach((p) => p.applyTransform(transform))
      let pathStr = "M" + ps.map((p) => p.x + "," + p.y).join("L") + "Z"
      setAttr(this.selectedRectMap.get(elements[0].id), {
        d: pathStr,
      })
    }
  }

  private clear() {
    this.selectedRectMap.forEach((e) => setAttr(e, { display: "none" }))
  }
}
