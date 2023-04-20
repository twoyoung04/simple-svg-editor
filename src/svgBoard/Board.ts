import { BaseElement } from "./BaseElement"
import { ELLIPSE } from "./Ellipse"
import { BoardEvent, EventEmitter, EventType } from "./EventEmitter"
import { NS } from "./namespaces"
import { Rect } from "./Rect"
import { generateSvgElement, isMac, setAttr } from "./utilities"
import { Selector } from "./Selector"
import { Log } from "./Log"
import { Area } from "./Area"
import { Box } from "./Box"
import { Transform } from "./Transform"
import { Vector2 } from "./Vector"
import { MouseStatusManager } from "./MouseStatusManager"
import { ShortcutManager } from "./ShortcutManager"
import { UndoManager } from "./history"
import { Viewport } from "./viewport"
import { WorldPosition } from "./type"
import { clamp } from "lodash"

export class Board {
  private saveOptions: any
  private _selection: BaseElement[]
  fx: number
  fy: number
  lastSelectionArea: Area
  _cachedKeyEvent: BoardEvent
  undoManager: UndoManager
  viewport: Viewport
  worldPosition: WorldPosition
  zoom: number
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
  private shotcutManager: ShortcutManager

  private boardX = 0
  private boardY = 0

  // mouse relative
  // @todo: maybe not need this
  private MouseDown = false
  private mouseStartX = 0
  private mouseStartY = 0
  private lastZIndex = 0
  private _currentCreateMode: CreateMode
  public get currentCreateMode(): CreateMode {
    return this._currentCreateMode
  }
  public set currentCreateMode(value: CreateMode) {
    this._currentCreateMode = value
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
    this.container = container
    this.saveOptions = {}
    this.selection = []
    this.selectionArea = new Area(new Box(0, 0, 1, 1), Transform.identity())
    this.plugins = []
    this.currentMode = EditorMode.SELECT
    this.currentResizeMode = ResizeMode.CASUAL
    this.rubberBox = null
    this.curBBoxes = []
    this.curConfig = {
      dimensions: this.getTargetDimensions(),
    }
    this.elements = []
    this.selectionTransforms = []

    this.worldPosition = {x: 0, y: 0}
    this.zoom = 1;

    this.svgdoc = document

    this._eventEmitter = new EventEmitter()

    // !!! 画板自身的事件要先注册，以便管理器和插件拿到的是最新的状态
    this.initEventHandler()
    this.initCustomEventHandler()

    this._cachedEvent = new BoardEvent("", null)
    this._cachedKeyEvent = new BoardEvent("", null)
    this.mouseStatusManager = new MouseStatusManager(this)
    this.undoManager = new UndoManager(this)
    this.shotcutManager = new ShortcutManager(this)

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

    this.viewport = new Viewport(this);

    this.svgroot.append(this.canvasBg)
    this.svgroot.append(this.svgcontent)
    this.viewport.container.append(this.svgroot);
    this.container.append(this.viewport.container);
    this.container.style.overflow = 'hidden'

    // document.addEventListener('wheel', (e) => e.preventDefault())

    this.container.addEventListener('wheel', (event)=> {
      event.preventDefault()
      if (event.metaKey) {
        this.zoom += event.deltaY * 0.01 * this.zoom;
        this.zoom = clamp(this.zoom, 0.02, 10);
        
        this.viewport.update()
      }
      else {
        this.worldPosition.x += event.deltaX * 0.4 * this.zoom;
        this.worldPosition.y += event.deltaY * 0.4 * this.zoom;
        this.viewport.update()
      }
    })
    // this.container.append(this.svgroot)

    // this.addInstructions()

    this.initSelector()

    // @todo: 传递画板的引用给元素，有没有更好的办法？？
    ;(window as any).board = this
  }

  private getTargetDimensions() {
    let width = window.innerWidth
    let height = window.innerHeight
    return [width, height]
  }

  private updateBoardSize() {
    let svg2BeUpdate = [this.svgroot, this.canvasBg, this.svgcontent]
    svg2BeUpdate.forEach((item) => {
      setAttr(item, {
        width: this.curConfig.dimensions[0],
        height: this.curConfig.dimensions[1],
      })
    })
  }

  private addInstructions() {
    let instruction = this._svgdoc.createElementNS(
      NS.SVG,
      "foreignObject"
    ) as SVGForeignObjectElement
    setAttr(instruction, {
      x: "0",
      y: "40%",
      width: "100%",
      height: "200",
    })
    let p = this._svgdoc.createElement("p") as HTMLParagraphElement
    let texts = [
      "press R to draw Rectangle",
      "press O to draw Ellipse",
      `press ${isMac() ? "Command" : "Ctrl"} + Z to undo`,
      `press ${isMac() ? "Command" : "Ctrl"} + Shift + Z to redo`,
    ]
    p.innerHTML = texts.join("<br />")
    p.setAttribute(
      "style",
      "text-align: center; color: #bbb; user-select: none"
    )
    instruction.append(p)
    this.svgroot.append(instruction)
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
    window.addEventListener("resize", this.handleResize.bind(this))
    this.container.addEventListener("keydown", this.handleKeyDown.bind(this))
  }

  private initCustomEventHandler() {
    this._eventEmitter.on(EventType.SelectStart, this.onSelectStart.bind(this))
    this._eventEmitter.on(
      EventType.CreateStart,
      this.onCreateElement.bind(this)
    )
    this._eventEmitter.on(EventType.Creating, this.onCreateMove.bind(this))
    this._eventEmitter.on(EventType.CreateEnd, this.onCreateEnd.bind(this))
    this._eventEmitter.on(EventType.ChangeMode, this.onChangeMode.bind(this))
    this._eventEmitter.on(EventType.DragStart, this.onDragStart.bind(this))
    this._eventEmitter.on(EventType.Draging, this.onDraging.bind(this))
    this._eventEmitter.on(EventType.DragEnd, this.onDragEnd.bind(this))
    this._eventEmitter.on(EventType.RotateStart, this.onRotateStart.bind(this))
    this._eventEmitter.on(EventType.Rotating, this.onRotating.bind(this))
    this._eventEmitter.on(EventType.RotateEnd, this.onRotateEnd.bind(this))
    this._eventEmitter.on(EventType.ScaleStart, this.onScaleStart.bind(this))
    this._eventEmitter.on(EventType.Scaling, this.onScaling.bind(this))
    this._eventEmitter.on(EventType.ScaleEnd, this.onScaleEnd.bind(this))
    this._eventEmitter.on(
      EventType.MouseStatusChange,
      this.onMouseStatusChange.bind(this)
    )
    this._eventEmitter.on(
      EventType.ElementChanged,
      this.onElementChanged.bind(this)
    )
    // 封装一层，获取鼠标相对 x,y
    this._eventEmitter.on(EventType.MouseDown, this.onMouseDown.bind(this))
    this._eventEmitter.on(EventType.MouseMove, this.onMouseMove.bind(this))
    this._eventEmitter.on(EventType.MouseUp, this.onMouseUp.bind(this))
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
    console.log("selection: ", elements)
    this.selection = elements
    let eventType = EventType.ElementSelected
    if (!elements || elements.length == 0) {
      eventType = EventType.NothingSelected
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

  public setMode(mode: EditorMode) {
    this.currentMode = mode
    this._cachedEvent.customData = {
      mode,
    }
    this._eventEmitter.trigger(EventType.ChangeMode, [this._cachedEvent])
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

  // delegate method on & trigger to board
  public on(event: EventType, handler: (e: BoardEvent) => void) {
    this._eventEmitter.on(event, handler)
  }
  public trigger(event: EventType, e: BoardEvent) {
    this._eventEmitter.trigger(event, [e])
  }

  // original events
  protected handleMouseDown(e: MouseEvent) {
    const pos = this.viewport.getPagePosFromClient({x: e.clientX, y: e.clientY});
    const clientX = pos.x;
    const clientY = pos.y;
    this.mouseStartX = clientX - this.boardX
    this.mouseStartY = clientY - this.boardY

    this._cachedEvent.originEvent = e
    this._cachedEvent.customData || (this._cachedEvent.customData = {})
    this._cachedEvent.customData.x = this.mouseStartX
    this._cachedEvent.customData.y = this.mouseStartY
    this._eventEmitter.trigger(EventType.MouseDown, [this._cachedEvent])
  }
  protected handleMouseMove(e: MouseEvent) {
    const pos = this.viewport.getPagePosFromClient({x: e.clientX, y: e.clientY});
    const clientX = pos.x;
    const clientY = pos.y;
    let [x, y] = [clientX - this.boardX, clientY - this.boardY]
    this._cachedEvent.originEvent = e

    this._cachedEvent.customData || (this._cachedEvent.customData = {})
    this._cachedEvent.customData.x = x
    this._cachedEvent.customData.y = y
    this._eventEmitter.trigger(EventType.MouseMove, [this._cachedEvent])
  }
  protected handleMouseUp(e: MouseEvent) {
    const pos = this.viewport.getPagePosFromClient({x: e.clientX, y: e.clientY});
    const clientX = pos.x;
    const clientY = pos.y;
    this._cachedEvent.originEvent = e
    this._cachedEvent.customData.x = clientX - this.boardX
    this._cachedEvent.customData.y = clientY - this.boardY
    this._eventEmitter.trigger(EventType.MouseUp, [this._cachedEvent])
  }
  protected handleClick(e: MouseEvent) {}
  protected handleDBClick(e: MouseEvent) {}
  protected handleKeyDown(e: KeyboardEvent) {
    this._cachedKeyEvent.originEvent = e
    this.trigger(EventType.KeyDown, this._cachedKeyEvent)
  }
  protected handleResize(e) {
    this.updateBoardPosition()
    this.curConfig.dimensions = this.getTargetDimensions()
    this.updateBoardSize()
  }

  // custom events
  private onMouseDown(e: BoardEvent) {
    console.log("function onMouseDown...")
    this.MouseDown = true

    if (this.currentMode === EditorMode.CREATE) {
      this._cachedEvent.customData = {
        type: this.currentCreateMode,
        startX: this.mouseStartX,
        startY: this.mouseStartY,
      }
      this._eventEmitter.trigger(EventType.CreateStart, [this._cachedEvent])
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
        this._eventEmitter.trigger(EventType.SelectStart, [this._cachedEvent])
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
      this._eventEmitter.trigger(EventType.Creating, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.DRAG) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger(EventType.Draging, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.ROTATE) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger(EventType.Rotating, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SCALE) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger(EventType.Scaling, [this._cachedEvent])
    } else if (this.MouseDown) {
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.customData.x,
        endY: e.customData.y,
      }
      this._eventEmitter.trigger(EventType.Selecting, [this._cachedEvent])
    }
  }
  private onMouseUp(e: BoardEvent) {
    this.MouseDown = false
    if (this.currentMode === EditorMode.CREATE) {
      this._eventEmitter.trigger(EventType.CreateEnd, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SELECT) {
      this._eventEmitter.trigger(EventType.SelectEnd, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.ROTATE) {
      this._eventEmitter.trigger(EventType.RotateEnd, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.DRAG) {
      this._eventEmitter.trigger(EventType.DragEnd, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SCALE) {
      this._eventEmitter.trigger(EventType.ScaleEnd, [this._cachedEvent])
    }
    this.currentMode = EditorMode.SELECT
  }

  private onSelectStart(e: BoardEvent) {}
  private onSelectMove(e: BoardEvent) {}
  private onSelectEnd(e: BoardEvent) {}

  private onCreateElement(e: BoardEvent) {
    const { originEvent: mouseEvent, customData } = e
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
    const { originEvent: mouseEvent, customData } = e
    let [width, height] = [
      Math.abs(customData.endX - customData.startX),
      Math.abs(customData.endY - customData.startY),
    ]
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
  private onDragStart(e: BoardEvent) {
    e.elements = this.selection
    this.trigger(EventType.ElementChangeStart, e)
    this.selectionTransforms = this.selection.map((n) => n.transform.clone())
    this.selection.forEach((e) => (e.lastTransform = e.transform.clone()))
  }
  private onDraging(e: BoardEvent) {
    const { originEvent: mouseEvent, customData } = e
    const { startX, startY, endX, endY } = customData
    // @todo: 需要记录 drag 之前的 transform 信息
    this.selection.forEach((n, index) => {
      n.transform.e = this.selectionTransforms[index].e + endX - startX
      n.transform.f = this.selectionTransforms[index].f + endY - startY
      n.updateRendering()
    })
    this.updateSelectionArea()
  }
  private onDragEnd(e: BoardEvent) {
    e.elements = this.selection
    this.trigger(EventType.ElementChangeEnd, e)
  }

  private onRotateStart(e: BoardEvent) {
    e.elements = this.selection
    this.trigger(EventType.ElementChangeStart, e)
    this.selectionTransforms = this.selection.map((n) => n.transform.clone())
    this.lastSelectionArea = this.selectionArea.clone()
  }
  private onRotating(e: BoardEvent) {
    const { originEvent: mouseEvent, customData } = e
    const { startX, startY, endX, endY } = customData
    let center = this.lastSelectionArea.center()
    let a = new Vector2(startX - center.x, startY - center.y)
    let b = new Vector2(endX - center.x, endY - center.y)
    let theta = a.angle(b)
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
  private onRotateEnd(e: BoardEvent) {
    e.elements = this.selection
    this.trigger(EventType.ElementChangeEnd, e)
    this.updateSelectionArea()
  }

  private onScaleStart(e: BoardEvent) {
    e.elements = this.selection
    this.trigger(EventType.ElementChangeStart, e)

    this.lastFrameWidth = this.selection[0].frameWidth
    this.lastFrameHeight = this.selection[0].frameHeight
    this.selectionTransforms = this.selection.map((n) => n.transform.clone())
    this.lastSelectionArea = this.selectionArea.clone()
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
    const { originEvent: mouseEvent, customData } = e
    const { startX, startY, endX, endY } = customData
    let start = new Vector2(startX, startY)
    let end = new Vector2(endX, endY)

    let fx = this.fx
    let fy = this.fy

    // @todo: 待优化，这里看下怎么复用下两种情况下的代码
    if (this.selection.length == 1) {
      let n = this.selection[0]
      let a = start
        .clone()
        .applyTransform(this.selectionTransforms[0].inverse())
      let b = end.clone().applyTransform(this.selectionTransforms[0].inverse())
      b.subtract(a)

      // avoid the value become 0
      let [x, y] = [fx * b.x + 1, fy * b.y + 1]
      let [absx, absy] = [
        Math.max(Math.abs(x), 0.001),
        Math.max(Math.abs(y), 0.001),
      ]
      x = x < 0 ? -absx : absx
      y = y < 0 ? -absy : absy
      n.transform.copy(
        this.selectionTransforms[0]
          .clone()
          .scale(x, y, new Vector2(fx == -1 ? 1 : 0, fy == -1 ? 1 : 0))
      )
      n.updateRendering()
    } else {
      // 以下只适合多选
      let [tw, th] = [
        this.lastSelectionArea.box.w,
        this.lastSelectionArea.box.h,
      ]
      let v = end.subtract(start)
      let [x, y] = [(fx * v.x) / tw + 1, (fy * v.y) / th + 1]
      let [absx, absy] = [
        Math.max(Math.abs(x), 0.001),
        Math.max(Math.abs(y), 0.001),
      ]
      x = x < 0 ? -absx : absx
      y = y < 0 ? -absy : absy
      let box = this.lastSelectionArea.box
      let rotateCenter = new Vector2(box.x, box.y).add(
        new Vector2(fx == -1 ? box.w : 0, fy == -1 ? box.h : 0)
      )

      this.selection.forEach((n, index) => {
        n.transform.copy(
          this.selectionTransforms[index].clone().scale2(x, y, rotateCenter)
        )
        n.updateRendering()
      })
    }
    this.updateSelectionArea()
  }
  private onScaleEnd(e: BoardEvent) {
    e.elements = this.selection
    this.trigger(EventType.ElementChangeEnd, e)
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
      this._cachedEvent.customData = {
        transforms: this.selectionTransforms,
      }
      this._eventEmitter.trigger(EventType.DragStart, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.ROTATE) {
      this._cachedEvent.customData = {
        transforms: this.selectionTransforms,
      }
      this._eventEmitter.trigger(EventType.RotateStart, [this._cachedEvent])
    } else if (this.currentMode == EditorMode.SCALE) {
      this._cachedEvent.customData = {
        transforms: this.selectionTransforms,
      }
      this._eventEmitter.trigger(EventType.ScaleStart, [this._cachedEvent])
    }
  }

  private onElementChanged(e: BoardEvent) {
    this.updateSelectionArea()
  }

  private onMouseStatusChange(e: BoardEvent) {}

  // judge
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
