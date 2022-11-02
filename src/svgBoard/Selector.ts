import { Area } from "./Area"
import { Board } from "./Board"
import { Box } from "./Box"
import config from "./config"
import { BoardEvent, EventType } from "./EventEmitter"
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
  private activeGroup: SVGGElement
  private activeMap: Map<string, SVGPathElement>
  private manuplator: SVGGElement
  private manuplatorRect: SVGPathElement
  private manuplatorPoints: SVGGElement
  private selectedCorner: SVGGElement
  private selectArea: Area
  private lastSelectedNum: number

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
    this.activeGroup = board.svgdoc.createElementNS(NS.SVG, "g") as SVGGElement
    this.selectorRoot.append(this.activeGroup)
    this.activeMap = new Map()

    this.manuplator = board.svgdoc.createElementNS(NS.SVG, "g") as SVGGElement
    this.selectorRoot.append(this.manuplator)
    setAttr(this.manuplator, { display: "none" })

    this.manuplatorRect = board.svgdoc.createElementNS(
      NS.SVG,
      "path"
    ) as SVGPathElement
    setAttr(this.manuplatorRect, {
      fill: "none",
      "stroke-width": 2.5,
      stroke: config.COLOR_SELECT,
    })
    this.manuplator.append(this.manuplatorRect)
    this.manuplatorPoints = board.svgdoc.createElementNS(
      NS.SVG,
      "g"
    ) as SVGGElement
    this.manuplator.append(this.manuplatorPoints)
    for (let i = 0; i < 4; i++) {
      let point = board.svgdoc.createElementNS(NS.SVG, "path")
      setAttr(point, {
        fill: "#fcfcfc",
        "stroke-width": 1.5,
        stroke: config.COLOR_SELECT,
      })
      this.manuplatorPoints.append(point)
    }

    this.lastSelectedNum = 0
    this.selectArea = new Area(new Box(0, 0, 1, 1), Transform.identity())
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

    board.eventEmitter.on(EventType.SelectStart, this.onSelectStart.bind(this))
    board.eventEmitter.on(EventType.Selecting, this.onSelectMove.bind(this))
    board.eventEmitter.on(EventType.SelectEnd, this.onSelectEnd.bind(this))
    board.eventEmitter.on(
      EventType.ElementSelected,
      this.onElemetSelected.bind(this)
    )
    board.eventEmitter.on(
      EventType.NothingSelected,
      this.onNothingSelected.bind(this)
    )
    board.eventEmitter.on(EventType.Creating, this.onCreating.bind(this))
    board.eventEmitter.on(EventType.Draging, this.onDraging.bind(this))
    board.eventEmitter.on(EventType.Rotating, this.onRotating.bind(this))
    board.eventEmitter.on(EventType.Scaling, this.onScaling.bind(this))
    board.eventEmitter.on(
      EventType.ElementChanged,
      this.onElementChanged.bind(this)
    )
  }

  private onSelectStart(e) {
    setAttr(this.selectRect, { display: "inline" })
  }

  private onSelectMove(e) {
    let x = Math.min(e.customData.startX, e.customData.endX)
    let y = Math.min(e.customData.startY, e.customData.endY)
    let width = Math.abs(e.customData.endX - e.customData.startX)
    let height = Math.abs(e.customData.endY - e.customData.startY)

    setAttr(this.selectRect, { x, y, width, height })
    this.selectArea.box.x = x
    this.selectArea.box.y = y
    this.selectArea.box.w = width
    this.selectArea.box.h = height
    let selected = []
    // @todo: 判断方式需要改一下，矩形相交
    this.board.elements.forEach((e) => {
      if (e.points.find((p) => this.selectArea.include(p))) {
        selected.push(e)
      }
    })
    if (this.lastSelectedNum != selected.length) {
      this.board.setSelected(selected)
      this.lastSelectedNum = selected.length
    }
  }
  private onSelectEnd(e: BoardEvent) {
    this.selectRect.setAttribute("display", "none")
    this.selectRect.setAttribute("width", "0")
    this.selectRect.setAttribute("height", "0")
  }

  private onElemetSelected(e: BoardEvent) {
    this.updateRender()
  }

  private onNothingSelected(e: BoardEvent) {
    this.activeMap.forEach((ele) => setAttr(ele, { display: "none" }))
    setAttr(this.manuplator, { display: "none" })
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
      setAttr(this.activeMap.get(elements[0].id), {
        transform: transform.cssString(),
        display: "inline",
        ...rect,
      })
    }
  }

  private onElementChanged(e: BoardEvent) {
    this.updateRender()
  }

  private updateSelector() {}

  private updateRender() {
    this.clear()
    const elements = this.board.selection
    // 获取最大宽高，若一个元素，则取该元素的 BBOX，多个元素则取 AABB 的并集
    if (!elements) return
    for (let element of elements) {
      const { transform } = element
      if (!this.activeMap.has(element.id)) {
        let ele = this.board.svgdoc.createElementNS(
          NS.SVG,
          "path"
        ) as SVGPathElement
        this.activeMap.set(element.id, ele)
        this.activeGroup.append(ele)
        setAttr(ele, {
          id: element.id,
          fill: "none",
          stroke: config.COLOR_SELECT,
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
      setAttr(this.activeMap.get(element.id), {
        display: "inline",
        d: pathStr,
      })
    }
    if (elements.length === 1) {
      setAttr(this.manuplator, {
        display: "inline",
      })
      let { box } = elements[0].area
      let ps = box.toVector2()
      ps.forEach((p) => p.applyTransform(elements[0].transform))

      // 选中单个元素的框是和元素的框一致的
      setAttr(this.manuplatorRect, {
        display: "none",
      })
      const width = 6
      let points = Array.from(this.manuplatorPoints.children)
      // 操作框仅需要与旋转值保持同步
      // FIX: 此处的旋转值还有一点问题
      points.forEach((p, i) => {
        setAttr(p, {
          d: generatePathStr(
            ps[i].x,
            ps[i].y,
            width,
            elements[0].transform.rotation
          ),
        })
      })
    } else if (elements.length >= 2) {
      // show the selector outside
      setAttr(this.manuplator, {
        display: "inline",
      })
      setAttr(this.manuplatorRect, {
        display: "inline",
      })
      let { box } = this.board.selectionArea
      let ps = box.toVector2()
      let pathStr = `M${box.x},${box.y}L${box.x},${box.y2}L${box.x2},${box.y2}L${box.x2},${box.y}Z`
      setAttr(this.manuplator.children[0], {
        d: pathStr,
      })
      const width = 6
      let points = Array.from(this.manuplatorPoints.children)
      points.forEach((p, i) => {
        setAttr(p, { d: generatePathStr(ps[i].x, ps[i].y, width) })
      })
    }
  }

  private clear() {
    this.activeMap.forEach((e) => setAttr(e, { display: "none" }))
  }
}

export function generatePathStr(
  x: number,
  y: number,
  width: number,
  rotation?: number
) {
  let points = [
    new Vector2(x - width / 2, y - width / 2),
    new Vector2(x - width / 2, y + width / 2),
    new Vector2(x + width / 2, y + width / 2),
    new Vector2(x + width / 2, y - width / 2),
  ]
  if (rotation) {
    points.forEach((p) =>
      p.applyTransform(Transform.identity().rotate(rotation, new Vector2(x, y)))
    )
  }
  let pathStr = "M" + points.map((p) => p.x + "," + p.y).join("L") + "Z"
  return pathStr
}
