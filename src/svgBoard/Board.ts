import { BaseElement } from "./BaseElement"
import { ELLIPSE } from "./Ellipse"
import { BoardEvent, EventEmitter } from "./EventEmitter"
import { NS } from "./namespaces"
import { Rect } from "./Rect"
import { generateSvgElement, setAttr } from "./utilities"
import { Selector } from "./Selector"
import { Log } from "./Log"
import { Area } from "./Area"
import { Box } from "./Box"
import { Transform } from "./Transform"
import { Vector2 } from "./Vector"

export class Board {
  private saveOptions: any
  private _selection: BaseElement[]
  public get selection(): BaseElement[] {
    return this._selection
  }
  public set selection(value: BaseElement[]) {
    this._selection = value
  }
  private selectionArea: Area
  private plugins: any[]
  private currentMode: EditorMode
  private currentResizeMode: ResizeMode
  private rubberBox: HTMLElement
  private curBBoxes: any[]
  private selector: Selector
  private container: HTMLElement
  private elements: BaseElement[]
  private _svgdoc: Document
  private _eventEmitter: EventEmitter
  private _cachedEvent: BoardEvent

  private boardX = 0
  private boardY = 0

  // mouse relative
  // @todo: maybe not need this
  private MouseDown = false
  private mouseStartX = 0
  private mouseStartY = 0
  private lastZIndex = 0
  private currentCreateMode: CreateMode

  private _mouseStatus = MouseStatus.DRAG
  public get mouseStatus() {
    return this._mouseStatus
  }
  public set mouseStatus(value) {
    if (this.mouseStatus == value) return
    this._mouseStatus = value
    this._cachedEvent.customData = {
      mouseStatus: value,
    }
    this._eventEmitter.trigger("mouseStatusChange", [this._cachedEvent])
  }

  public get eventEmitter(): EventEmitter {
    return this._eventEmitter
  }
  public set eventEmitter(value: EventEmitter) {
    this._eventEmitter = value
  }
  public get svgdoc(): Document {
    return this._svgdoc
  }
  public set svgdoc(value: Document) {
    this._svgdoc = value
  }
  private _svgroot: SVGElement
  public get svgroot(): SVGElement {
    return this._svgroot
  }
  public set svgroot(value: SVGElement) {
    this._svgroot = value
  }
  private svgcontent: SVGElement
  public static idPrefix = "svg"
  private curConfig: any
  private canvasBg: SVGElement

  // @todo: 此处存放一些交互时需要暂存的信息，后续看下怎么优化
  private selectionTransforms: Transform[]
  private lastFrameWidth: number
  private lastFrameHeight: number

  constructor(container: HTMLElement) {
    this.saveOptions = {}
    this.selection = []
    this.selectionArea = new Area(new Box(0, 0, 0, 0), Transform.identity())
    this.plugins = []
    this.currentMode = EditorMode.SELECT
    this.currentResizeMode = ResizeMode.CASUAL
    this.rubberBox = null
    this.curBBoxes = []
    this.curConfig = {
      dimensions: [800, 600],
    }
    this.elements = []
    this.selectionTransforms = []

    this._eventEmitter = new EventEmitter()
    this._cachedEvent = new BoardEvent("", null)

    this.container = container
    this.svgdoc = document

    this.updateBoardPosition()

    this.svgroot = this.svgdoc.createElementNS(NS.SVG, "svg") as SVGElement

    const svgAttributs = {
      xmlns: "http://www.w3.org/2000/svg",
      id: "svgroot",
      xlinks: "http://www.w3.org/1999/xlink",
      width: this.curConfig.dimensions[0],
      height: this.curConfig.dimensions[1],
      overflow: "visible",
    }
    Object.keys(svgAttributs).forEach((key) => {
      this.svgroot.setAttribute(key, svgAttributs[key])
    })

    const bgAttributes = {
      id: "svgBg",
      width: this.curConfig.dimensions[0],
      height: this.curConfig.dimensions[1],
      stroke: "#000",
      fill: "#fbfbfb",
      style: "pointer-events: none",
    }
    this.canvasBg = generateSvgElement(this._svgdoc, bgAttributes)

    const rect = this.svgdoc.createElementNS(NS.SVG, "rect") as SVGRectElement
    const rectAttributes = {
      id: "blabla",
      width: "100%",
      height: "100%",
      stroke: "#000",
      fill: "#f8f8f8",
      style: "pointer-events: none",
      x: 0,
      y: 0,
    }
    Object.keys(rectAttributes).forEach((key) => {
      rect.setAttribute(key, rectAttributes[key])
    })
    this.canvasBg.append(rect)

    this.svgcontent = generateSvgElement(this.svgdoc, {
      ...svgAttributs,
      id: "svgcontent",
    })

    this.svgroot.append(this.canvasBg)
    this.svgroot.append(this.svgcontent)
    this.container.append(this.svgroot)

    this.initSelector()

    this.initEventHandler()
    this.initCustomEventHandler()

    // @todo: 传递画板的引用给元素，有没有更好的办法？？
    ;(window as any).board = this
  }

  private initSelector() {
    this.selector = new Selector(this)
  }

  private initEventHandler() {
    // @todo: maybe 需要监听画板是否加载完成，后续优化
    this.container.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    )
    this.container.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.container.addEventListener("click", this.handleClick.bind(this))
    this.container.addEventListener("dblclick", this.handleDBClick.bind(this))
    this.container.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    )
    document.addEventListener("resize", () => {
      this.updateBoardPosition()
    })
    this.container.addEventListener("keydown", this.handleKeyDown.bind(this))
  }

  private initCustomEventHandler() {
    this._eventEmitter.on("selectStart", this.onSelectStart.bind(this))
    this._eventEmitter.on("createElement", this.onCreateElement.bind(this))
    this._eventEmitter.on("creating", this.onCreateMove.bind(this))
    this._eventEmitter.on("createEnd", this.onCreateEnd.bind(this))
    this._eventEmitter.on("changeMode", this.onChangeMode.bind(this))
    this._eventEmitter.on("dragStart", this.onDragStart.bind(this))
    this._eventEmitter.on("draging", this.onDraging.bind(this))
    this._eventEmitter.on("dragEnd", this.onDragEnd.bind(this))
    this._eventEmitter.on("rotating", this.onRotating.bind(this))
    this._eventEmitter.on("scaleStart", this.onScaleStart.bind(this))
    this._eventEmitter.on("scaling", this.onScaling.bind(this))
    this._eventEmitter.on(
      "mouseStatusChange",
      this.onMouseStatusChange.bind(this)
    )
  }

  private updateBoardPosition() {
    let bbox = this.container.getBoundingClientRect()
    this.boardX = bbox.x
    this.boardY = bbox.y
  }

  private updateMouseStatus(e: MouseEvent) {
    if (!this.selection || this.selection.length < 1) return false
    let [x, y] = [e.clientX - this.boardX, e.clientY - this.boardY]
    let dis = this.selectionArea.nearestCornerDistance(new Vector2(x, y))
    // this.MouseAtCorner = this.hoverAtSelectionCorner(new Vector2(x, y))
    if (dis < 5) {
      this.mouseStatus = MouseStatus.SCALE
    } else if (dis < 10) {
      this.mouseStatus = MouseStatus.ROTATE
    } else {
      this.mouseStatus = MouseStatus.DRAG
    }
  }

  public exportSvg(): string {
    return ""
  }

  // @todo: 这个方法修饰符应该设置成 private or protected
  public setSelected(elements: BaseElement[]) {
    console.log(elements)
    this.selection = elements
    let eventType = "elementSelected"
    if (!elements || elements.length == 0) {
      eventType = "nothingSelected"
    } else {
      this.updateSelectionArea()
      this._cachedEvent.customData = {
        elements,
        area: this.selectionArea,
      }
    }
    // @todo: create new events derived from BoardEvent
    this._eventEmitter.trigger(eventType, [this._cachedEvent])
  }

  private setMode(mode: EditorMode) {
    this.currentMode = mode
    this._cachedEvent.customData = {
      mode,
    }
    this._eventEmitter.trigger("changeMode", [this._cachedEvent])
  }

  private updateSelectionArea() {
    let elements = this.selection
    // calculate area
    if (elements.length == 1) {
      this.selectionArea.transform = elements[0].transform
      this.selectionArea.box.set4(
        0,
        0,
        elements[0].frameWidth,
        elements[0].frameHeight
      )
    } else {
      this.selectionArea.transform.reset()
      this.selectionArea.box = Box.mergeAll(elements.map((e) => e.AABB))
    }
  }

  // original events
  protected handleMouseDown(e: MouseEvent) {
    console.log("currentMode: ", this.currentMode)
    console.log("currentInsertMode: ", this.currentCreateMode)
    this.MouseDown = true
    this.mouseStartX = e.clientX - this.boardX
    this.mouseStartY = e.clientY - this.boardY
    // @todo: 元素被点击时，更新 this.selected
    if (this.currentMode === EditorMode.CREATE) {
      this._cachedEvent.mouseEvent = e
      this._cachedEvent.name = "createElement"
      this._cachedEvent.customData = {
        type: this.currentCreateMode,
        startX: this.mouseStartX,
        startY: this.mouseStartY,
      }
      this._eventEmitter.trigger("createElement", [this._cachedEvent])
      return
    }
    if (this._mouseStatus == MouseStatus.ROTATE) {
      this.setMode(EditorMode.ROTATE)
      return
    }
    if (this._mouseStatus == MouseStatus.SCALE) {
      this.setMode(EditorMode.SCALE)
      return
    }

    // 若点击在选中物体范围内则进入拖拽模式(enter drag mode if mouse down on the selected area)
    if (
      this.selection &&
      this.selection.length >= 1 &&
      this.clickOnSelectedArea(e)
    ) {
      this.setMode(EditorMode.DRAG)
    } else {
      if (
        this.clickOnElement(new Vector2(this.mouseStartX, this.mouseStartY))
      ) {
        this.setMode(EditorMode.DRAG)
      } else {
        this.setMode(EditorMode.SELECT)
        this._cachedEvent.mouseEvent = e
        this._cachedEvent.name = "selectStart"
        this._eventEmitter.trigger("selectStart", [this._cachedEvent])
      }
    }
  }
  protected handleMouseUp(e: MouseEvent) {
    console.log("mouse up...")
    this.MouseDown = false
    if (this.currentMode === EditorMode.CREATE) {
      this._cachedEvent.name = "createEnd"
      this._cachedEvent.mouseEvent = e
      this._eventEmitter.trigger("createEnd", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SELECT) {
      this._cachedEvent.name = "selectEnd"
      this._cachedEvent.mouseEvent = e
      this._eventEmitter.trigger("selectEnd", [this._cachedEvent])
    }
    this.currentMode = EditorMode.SELECT
  }
  protected handleMouseMove(e: MouseEvent) {
    this.updateMouseStatus(e)
    if (this.currentMode === EditorMode.CREATE && this.MouseDown) {
      this._cachedEvent.mouseEvent = e
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.clientX - this.boardX,
        endY: e.clientY - this.boardY,
      }
      this._eventEmitter.trigger("creating", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.DRAG) {
      this._cachedEvent.mouseEvent = e
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.clientX - this.boardX,
        endY: e.clientY - this.boardY,
      }
      this._eventEmitter.trigger("draging", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.ROTATE) {
      this._cachedEvent.mouseEvent = e
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.clientX - this.boardX,
        endY: e.clientY - this.boardY,
      }
      this._eventEmitter.trigger("rotating", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SCALE) {
      this._cachedEvent.mouseEvent = e
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.clientX - this.boardX,
        endY: e.clientY - this.boardY,
      }
      this._eventEmitter.trigger("scaling", [this._cachedEvent])
    } else if (this.MouseDown) {
      this._cachedEvent.mouseEvent = e
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.clientX - this.boardX,
        endY: e.clientY - this.boardY,
      }
      this._eventEmitter.trigger("selectMove", [this._cachedEvent])
    }
  }
  protected handleClick(e: MouseEvent) {}
  protected handleDBClick(e: MouseEvent) {}
  protected handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "r":
        this.setMode(EditorMode.CREATE)
        this.currentCreateMode = CreateMode.RECT
        break
      case "o":
        this.setMode(EditorMode.CREATE)
        this.currentCreateMode = CreateMode.ELLIPSE
        break
      case "l":
        this.setMode(EditorMode.CREATE)
        this.currentCreateMode = CreateMode.LINE
        break
      case "v":
        this.setMode(EditorMode.SELECT)
        this.currentCreateMode = CreateMode.LINE
        break
    }
  }

  // custom events
  private onSelectStart(e: BoardEvent) {}
  private onSelectMove(e: BoardEvent) {}
  private onSelectEnd(e: BoardEvent) {}

  private onCreateElement(e: BoardEvent) {
    const { mouseEvent, customData } = e
    switch (customData.type) {
      case CreateMode.RECT:
        let rect = new Rect(customData.startX, customData.startY, 0, 0)
        this.svgcontent.append(rect.domInstance)
        this.elements.push(rect)
        this.setSelected([rect])
        break
      case CreateMode.ELLIPSE:
        let ellipse = new ELLIPSE(customData.startX, customData.startY, 0, 0)
        this.svgcontent.append(ellipse.domInstance)
        this.elements.push(ellipse)
        this.setSelected([ellipse])
        break
      default:
        Log.Error("error insert mode")
    }
  }
  private onCreateMove(e: BoardEvent) {
    this.updateSelectionArea()
    if (this.container.className) this.container.className = ""
    console.log("handle create move...")
    const { mouseEvent, customData } = e
    let [width, height] = [
      Math.abs(customData.endX - customData.startX),
      Math.abs(customData.endY - customData.startY),
    ]
    this.selection[0].setFrameWidth(width)
    this.selection[0].setFrameHeight(height)
    this.selection[0].transform.e = Math.min(customData.endX, customData.startX)
    this.selection[0].transform.f = Math.min(customData.endY, customData.startY)
    this.selection[0].updateRendering()

    // @check: 在创建与变换元素时候需要时刻更新选择器，抛出这个事件是否合理？
    this._eventEmitter.trigger("elementSelected", [this._cachedEvent])
  }
  private onCreateEnd(e: BoardEvent) {
    console.log("create element end...")
  }
  private onDragStart(e: BoardEvent) {}
  private onDraging(e: BoardEvent) {
    const { mouseEvent, customData } = e
    const { startX, startY, endX, endY } = customData
    // @todo: 需要记录 drag 之前的 transform 信息
    this.selection.forEach((n, index) => {
      n.transform.e = this.selectionTransforms[index].e + endX - startX
      n.transform.f = this.selectionTransforms[index].f + endY - startY
      n.updateRendering()
    })
  }
  private onDragEnd(e: BoardEvent) {}

  private onRotateStart(e: BoardEvent) {}
  private onRotating(e: BoardEvent) {
    const { mouseEvent, customData } = e
    const { startX, startY, endX, endY } = customData
    let center = this.selectionArea.center()
    let a = new Vector2(startX - center.x, startY - center.y)
    let b = new Vector2(endX - center.x, endY - center.y)
    let theta = a.angle(b)
    console.log("theta: ", theta)
    let flag = a.crossMultiply(b)

    theta = flag > 0 ? theta : Math.PI * 2 - theta
    this.selection.forEach((n, index) => {
      n.transform.copy(
        this.selectionTransforms[index].clone().rotate(theta, center)
      )
      n.updateRendering()
    })

    this.updateSelectionArea()
  }
  private onRotateEnd(e: BoardEvent) {}

  private onScaleStart(e: BoardEvent) {
    // @todo: 还没考虑多选情况
    this.lastFrameWidth = this.selection[0].frameWidth
    this.lastFrameHeight = this.selection[0].frameHeight
  }
  private onScaling(e: BoardEvent) {
    const { mouseEvent, customData } = e
    const { startX, startY, endX, endY } = customData
    let a = new Vector2(startX, startY)
    let b = new Vector2(endX, endY)

    this.selection.forEach((n, index) => {
      a.applyTransform(this.selectionTransforms[index].inverse())
      b.applyTransform(this.selectionTransforms[index].inverse())
      b.subtract(a)
      let [x, y] = [
        b.x / this.lastFrameWidth + 1,
        b.y / this.lastFrameHeight + 1,
      ]
      console.log(x, y)
      // @todo: 计算各种情况，此处仅仅计算了左上角
      n.transform.copy(
        this.selectionTransforms[index].clone().scale(x, y, Vector2.zeros())
      )
      n.updateRendering()
    })

    this.updateSelectionArea()
  }
  private onScaleEnd(e: BoardEvent) {}

  private onChangeMode(e: BoardEvent) {
    const { customData } = e
    console.log("change mode:", customData.mode)
    if (customData.mode === EditorMode.SELECT) {
      this.setSelected([])
    } else if (this.currentMode === EditorMode.CREATE) {
      this.container.className = "cursor-crosshair"
    } else if (this.currentMode == EditorMode.DRAG) {
      this.selectionTransforms = this.selection.map((n) => n.transform.clone())
      this._cachedEvent.customData = {
        transforms: this.selectionTransforms,
      }
      this._eventEmitter.trigger("dragStart", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.ROTATE) {
      this.selectionTransforms = this.selection.map((n) => n.transform.clone())
      this._cachedEvent.customData = {
        transforms: this.selectionTransforms,
      }
      this._eventEmitter.trigger("rotateStart", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SCALE) {
      this.selectionTransforms = this.selection.map((n) => n.transform.clone())
      this._cachedEvent.customData = {
        transforms: this.selectionTransforms,
      }
      this._eventEmitter.trigger("scaleStart", [this._cachedEvent])
    }
  }

  private onMouseStatusChange(e: BoardEvent) {
    const { customData } = e
    switch (customData.mouseStatus) {
      default:
      case MouseStatus.DRAG:
        this.container.className = ""
        break
      case MouseStatus.ROTATE:
        this.container.className = "cursor-move"
        break
      case MouseStatus.SCALE:
        this.container.className = "cursor-resize"
        break
    }
  }

  private clickOnSelectedArea(e: MouseEvent) {
    return this.selectionArea.include(
      new Vector2(e.clientX - this.boardX, e.clientY - this.boardY)
    )
  }

  private clickOnElement(pos) {
    // @todo: 给每个元素设置一个 Area 属性
    let element = this.elements
      .sort((a, b) => (a.zIndex > b.zIndex ? 1 : -1))
      .find((e) => {
        return new Area(
          new Box(0, 0, e.frameWidth, e.frameHeight),
          e.transform
        ).include(pos)
      })
    this.setSelected(element ? [element] : [])
    return !!element
  }

  private hoverAtSelectionCorner(pos: Vector2) {
    if (!this.selection || this.selection.length < 1) return false
    // here is a calc trick. 将需要判断的点乘以矩阵的逆
    return this.selectionArea.nearestCornerDistance(pos) < 10
  }
}

export enum EditorMode {
  SELECT = "SELECT",
  DRAG = "DRAG",
  ROTATE = "ROTATE",
  SCALE = "SCALE",
  CREATE = "CREATE",
  DRAW = "DRAW",
}

export enum CreateMode {
  RECT = "RECT",
  ELLIPSE = "ELLIPsE",
  LINE = "LINE",
}

export enum ResizeMode {
  CASUAL,
  SCALE,
}

export enum MouseStatus {
  DRAG,
  SCALE,
  ROTATE,
}

export class EventHandler {
  private static instance: EventHandler = null
  private constructor() {}
  static getInstance() {
    if (!EventHandler.instance) {
      EventHandler.instance = new EventHandler()
    }
    return EventHandler.instance
  }
}
