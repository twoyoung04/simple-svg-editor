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
import { MouseStatusManager } from "./MouseStatusManager"

export class Board {
  private saveOptions: any
  private _selection: BaseElement[]
  fx: number
  fy: number
  public get selection(): BaseElement[] {
    return this._selection
  }
  public set selection(value: BaseElement[]) {
    this._selection = value
  }
  private _selectionArea: Area
  public get selectionArea(): Area {
    return this._selectionArea
  }
  public set selectionArea(value: Area) {
    this._selectionArea = value
  }
  private plugins: any[]
  private currentMode: EditorMode
  private currentResizeMode: ResizeMode
  private rubberBox: HTMLElement
  private curBBoxes: any[]
  private selector: Selector
  private _container: HTMLElement
  public get container(): HTMLElement {
    return this._container
  }
  public set container(value: HTMLElement) {
    this._container = value
  }
  private _elements: BaseElement[]
  public get elements(): BaseElement[] {
    return this._elements
  }
  public set elements(value: BaseElement[]) {
    this._elements = value
  }
  private _svgdoc: Document
  private _eventEmitter: EventEmitter
  private _cachedEvent: BoardEvent

  private mouseStatusManager: MouseStatusManager

  private boardX = 0
  private boardY = 0

  // mouse relative
  // @todo: maybe not need this
  private MouseDown = false
  private mouseStartX = 0
  private mouseStartY = 0
  private lastZIndex = 0
  private currentCreateMode: CreateMode

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
    this.selectionArea = new Area(new Box(0, 0, 1, 1), Transform.identity())
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
    this.mouseStatusManager = new MouseStatusManager(this)

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
    this._eventEmitter.on("rotateStart", this.onRotateStart.bind(this))
    this._eventEmitter.on("rotating", this.onRotating.bind(this))
    this._eventEmitter.on("rotateEnd", this.onRotateEnd.bind(this))
    this._eventEmitter.on("scaleStart", this.onScaleStart.bind(this))
    this._eventEmitter.on("scaling", this.onScaling.bind(this))
    this._eventEmitter.on("scaleEnd", this.onScaleEnd.bind(this))
    this._eventEmitter.on(
      "mouseStatusChange",
      this.onMouseStatusChange.bind(this)
    )
    // 封装一层，获取鼠标相对 x,y
    this._eventEmitter.on("mouseDown", this.onMouseDown.bind(this))
    this._eventEmitter.on("mouseMove", this.onMouseMove.bind(this))
    this._eventEmitter.on("mouseUp", this.onMouseUp.bind(this))
  }

  private updateBoardPosition() {
    let bbox = this.container.getBoundingClientRect()
    this.boardX = bbox.x
    this.boardY = bbox.y
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
      // elements.forEach((e) => console.log(e.id, e.transform.a))
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
      this.selectionArea.transform = elements[0].transform.clone()
      this.selectionArea.box = new Box(0, 0, 1, 1)
    } else {
      this.selectionArea.transform.reset()
      this.selectionArea.box = Box.mergeAll(elements.map((e) => e.AABB))
      // console.log(elements[0].transform)
      // console.log(elements[1].transform)
      // console.log(elements.map((e) => e.AABB))
      // console.log(this.selectionArea.box)
    }
  }

  // original events
  protected handleMouseDown(e: MouseEvent) {
    this.mouseStartX = e.clientX - this.boardX
    this.mouseStartY = e.clientY - this.boardY

    this._cachedEvent.mouseEvent = e
    this._cachedEvent.customData || (this._cachedEvent.customData = {})
    this._cachedEvent.customData.x = this.mouseStartX
    this._cachedEvent.customData.y = this.mouseStartY
    this._eventEmitter.trigger("mouseDown", [this._cachedEvent])
  }
  protected handleMouseMove(e: MouseEvent) {
    let [x, y] = [e.clientX - this.boardX, e.clientY - this.boardY]
    this._cachedEvent.mouseEvent = e

    this._cachedEvent.customData || (this._cachedEvent.customData = {})
    this._cachedEvent.customData.x = x
    this._cachedEvent.customData.y = y
    this._eventEmitter.trigger("mouseMove", [this._cachedEvent])
  }
  protected handleMouseUp(e: MouseEvent) {
    this._cachedEvent.mouseEvent = e
    this._cachedEvent.customData.x = e.clientX - this.boardX
    this._cachedEvent.customData.y = e.clientY - this.boardY
    this._eventEmitter.trigger("mouseUp", [this._cachedEvent])
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
  private onMouseDown(e: BoardEvent) {
    console.log("function onMouseDown...")
    this.MouseDown = true
    if (this.currentMode === EditorMode.CREATE) {
      this._cachedEvent.name = "createElement"
      this._cachedEvent.customData = {
        type: this.currentCreateMode,
        startX: this.mouseStartX,
        startY: this.mouseStartY,
      }
      this._eventEmitter.trigger("createElement", [this._cachedEvent])
      return
    }
    console.log("not create mode...")
    if (this.mouseStatusManager.mouseStatus == MouseStatus.ROTATE) {
      this.setMode(EditorMode.ROTATE)
      return
    }
    console.log("not rotate mode...")
    if (this.mouseStatusManager.mouseStatus == MouseStatus.SCALE) {
      this.setMode(EditorMode.SCALE)
      return
    }
    console.log("not scale mode...")
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
        this._cachedEvent.name = "selectStart"
        this._eventEmitter.trigger("selectStart", [this._cachedEvent])
      }
    }
  }
  private onMouseMove(e: BoardEvent) {
    if (this.currentMode === EditorMode.CREATE && this.MouseDown) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger("creating", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.DRAG) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger("draging", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.ROTATE) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger("rotating", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SCALE) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger("scaling", [this._cachedEvent])
    } else if (this.MouseDown) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger("selectMove", [this._cachedEvent])
    }
  }
  private onMouseUp(e: BoardEvent) {
    this.MouseDown = false
    if (this.currentMode === EditorMode.CREATE) {
      this._eventEmitter.trigger("createEnd", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SELECT) {
      this._eventEmitter.trigger("selectEnd", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.ROTATE) {
      this._eventEmitter.trigger("rotateEnd", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.DRAG) {
      this._eventEmitter.trigger("dragEnd", [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SCALE) {
      this._eventEmitter.trigger("scaleEnd", [this._cachedEvent])
    }
    this.currentMode = EditorMode.SELECT
  }

  private onSelectStart(e: BoardEvent) {}
  private onSelectMove(e: BoardEvent) {}
  private onSelectEnd(e: BoardEvent) {}

  private onCreateElement(e: BoardEvent) {
    const { mouseEvent, customData } = e
    console.log(customData.type)
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
    console.log(this.selection)
    if (this.container.className) this.container.className = ""
    console.log("handle create move...")
    const { mouseEvent, customData } = e
    let [width, height] = [
      Math.abs(customData.endX - customData.startX),
      Math.abs(customData.endY - customData.startY),
    ]
    console.log(width, height)
    // 元素的实际位置和大小由 Box（0，0，1，1）与 transform 结合表示
    this.selection[0].transform.a = width
    this.selection[0].transform.d = height
    this.selection[0].transform.e = Math.min(customData.endX, customData.startX)
    this.selection[0].transform.f = Math.min(customData.endY, customData.startY)
    this.selection[0].updateRendering()
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
    this.updateSelectionArea()
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
    let flag = a.crossMultiply(b)

    theta = flag > 0 ? theta : Math.PI * 2 - theta
    console.log((theta / Math.PI) * 180)
    this.selection.forEach((n, index) => {
      n.transform.copy(
        this.selectionTransforms[index].clone().rotate(theta, center)
      )
      n.updateRendering()
    })
  }
  private onRotateEnd(e: BoardEvent) {
    this.updateSelectionArea()
  }

  private onScaleStart(e: BoardEvent) {
    // @todo: 还没考虑多选情况
    this.lastFrameWidth = this.selection[0].frameWidth
    this.lastFrameHeight = this.selection[0].frameHeight
    let fx = 1
    let fy = 1
    switch (this.mouseStatusManager.cornerType) {
      default:
      case DIRECTION.RB:
        break
      case DIRECTION.RT:
        fy = -1
        break
      case DIRECTION.LB:
        fx = -1
        break
      case DIRECTION.LT:
        fx = fy = -1
        break
    }
    this.fx = fx
    this.fy = fy
  }
  private onScaling(e: BoardEvent) {
    const { mouseEvent, customData } = e
    const { startX, startY, endX, endY } = customData
    let start = new Vector2(startX, startY)
    let end = new Vector2(endX, endY)

    let fx = this.fx
    let fy = this.fy

    // @todo: 目前都是相对于自己的左上角缩放
    if (this.selection.length == 1) {
      this.selection.forEach((n, index) => {
        let a = start
          .clone()
          .applyTransform(this.selectionTransforms[index].inverse())
        let b = end
          .clone()
          .applyTransform(this.selectionTransforms[index].inverse())
        b.subtract(a)

        // !!! @todo: avoid the value become 0
        let [x, y] = [fx * b.x + 1, fy * b.y + 1]
        let [absx, absy] = [
          Math.max(Math.abs(x), 0.001),
          Math.max(Math.abs(y), 0.001),
        ]
        x = x < 0 ? -absx : absx
        y = y < 0 ? -absy : absy
        // @todo: 计算各种情况，此处仅仅计算了左上角
        n.transform.copy(
          this.selectionTransforms[index]
            .clone()
            .scale(x, y, new Vector2(fx == -1 ? 1 : 0, fy == -1 ? 1 : 0))
        )
        n.updateRendering()
      })
    } else {
      // 以下只适合多选
      let [tw, th] = [this.selectionArea.box.w, this.selectionArea.box.h]
      let v = end.subtract(start)
      let [x, y] = [(fx * v.x) / tw + 1, (fy * v.y) / th + 1]
      let [absx, absy] = [
        Math.max(Math.abs(x), 0.001),
        Math.max(Math.abs(y), 0.001),
      ]
      x = x < 0 ? -absx : absx
      y = y < 0 ? -absy : absy
      let box = this.selectionArea.box

      this.selection.forEach((n, index) => {
        // @todo: 计算各种情况，此处仅仅计算了左上角
        n.transform.copy(
          this.selectionTransforms[index]
            .clone()
            .scale2(
              x,
              y,
              new Vector2(box.x, box.y).add(
                new Vector2(fx == -1 ? box.w : 0, fy == -1 ? box.h : 0)
              )
            )
        )
        n.updateRendering()
      })
    }
  }
  private onScaleEnd(e: BoardEvent) {
    this.updateSelectionArea()
  }

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

  private onMouseStatusChange(e: BoardEvent) {}

  private clickOnSelectedArea(e: BoardEvent) {
    return this.selectionArea.include(
      new Vector2(e.customData.x, e.customData.y)
    )
  }

  private clickOnElement(pos) {
    // @todo: 给每个元素设置一个 Area 属性
    let element = this.elements
      .sort((a, b) => (a.zIndex > b.zIndex ? 1 : -1))
      .find((e) => {
        return new Area(new Box(0, 0, 1, 1), e.transform).include(pos)
      })
    this.setSelected(element ? [element] : [])
    console.log("into function clickONElement")
    element && console.log("click on:", element.id)
    return !!element
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
  SELECT = "SELECT",
  DRAG = "DRAG",
  SCALE = "SCALE",
  ROTATE = "ROTATE",
}

export enum DIRECTION {
  LT,
  LM,
  LB,
  CT,
  CM,
  CB,
  RT,
  RM,
  RB,
}
