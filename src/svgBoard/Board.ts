import { BaseElement } from "./BaseElement";
import { ELLIPSE } from "./Ellipse";
import { BoardEvent, EventEmitter } from "./EventEmitter";
import { NS } from "./namespaces";
import { Rect } from "./Rect";
import { generateSvgElement, setAttr } from "./utilities";
import { Selector } from "./Selector";
import { Log } from "./Log";

export class Board {
  private saveOptions: any;
  private _selected: BaseElement;
  public get selected(): BaseElement {
    return this._selected;
  }
  public set selected(value: BaseElement) {
    this._selected = value;
  }
  private plugins: any[];
  private currentMode: EditorMode;
  private currentResizeMode: ResizeMode;
  private rubberBox: HTMLElement;
  private curBBoxes: any[];
  private selector: Selector;
  private container: HTMLElement;
  private elements: BaseElement[];
  private _svgdoc: Document;
  private _eventEmitter: EventEmitter;
  private _cachedEvent: BoardEvent;

  private boardX = 0;
  private boardY = 0;

  // mouse relative
  // @todo: maybe not need this
  private MouseDown = false;
  private mouseStartX = 0;
  private mouseStartY = 0;
  currentInsertMode: InsertMode;

  public get eventEmitter(): EventEmitter {
    return this._eventEmitter;
  }
  public set eventEmitter(value: EventEmitter) {
    this._eventEmitter = value;
  }
  public get svgdoc(): Document {
    return this._svgdoc;
  }
  public set svgdoc(value: Document) {
    this._svgdoc = value;
  }
  private _svgroot: SVGElement;
  public get svgroot(): SVGElement {
    return this._svgroot;
  }
  public set svgroot(value: SVGElement) {
    this._svgroot = value;
  }
  private svgcontent: SVGElement;
  public static idPrefix = "svg";
  private curConfig: any;
  private canvasBg: SVGElement;

  constructor(container: HTMLElement) {
    this.saveOptions = {};
    this.selected = null;
    this.plugins = [];
    this.currentMode = EditorMode.SELECT;
    this.currentResizeMode = ResizeMode.CASUAL;
    this.rubberBox = null;
    this.curBBoxes = [];
    this.curConfig = {
      dimensions: [800, 600],
    };
    this.elements = [];

    this._eventEmitter = new EventEmitter();
    this._cachedEvent = new BoardEvent("", null);

    this.container = container;
    this.svgdoc = document;

    this.updateBoardPosition();

    this.svgroot = this.svgdoc.createElementNS(NS.SVG, "svg") as SVGElement;

    const svgAttributs = {
      xmlns: "http://www.w3.org/2000/svg",
      id: "svgroot",
      xlinks: "http://www.w3.org/1999/xlink",
      width: this.curConfig.dimensions[0],
      height: this.curConfig.dimensions[1],
      overflow: "visible",
    };
    Object.keys(svgAttributs).forEach((key) => {
      this.svgroot.setAttribute(key, svgAttributs[key]);
    });

    const bgAttributes = {
      id: "svgBg",
      width: this.curConfig.dimensions[0],
      height: this.curConfig.dimensions[1],
      stroke: "#000",
      fill: "#fbfbfb",
      style: "pointer-events: none",
    };
    this.canvasBg = generateSvgElement(this._svgdoc, bgAttributes);

    const rect = this.svgdoc.createElementNS(NS.SVG, "rect") as SVGRectElement;
    const rectAttributes = {
      id: "blabla",
      width: "100%",
      height: "100%",
      stroke: "#000",
      fill: "#f8f8f8",
      style: "pointer-events: none",
      x: 0,
      y: 0,
    };
    Object.keys(rectAttributes).forEach((key) => {
      rect.setAttribute(key, rectAttributes[key]);
    });
    this.canvasBg.append(rect);

    this.svgcontent = generateSvgElement(this.svgdoc, {
      ...svgAttributs,
      id: "svgcontent",
    });

    this.svgroot.append(this.canvasBg);
    this.svgroot.append(this.svgcontent);
    this.container.append(this.svgroot);

    this.initSelector();

    this.initEventHandler();
    this.initCustomEventHandler();
  }

  private initSelector() {
    this.selector = new Selector(this);
  }

  private initEventHandler() {
    // @todo: maybe 需要监听画板是否加载完成，后续优化
    this.container.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    this.container.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.container.addEventListener("click", this.handleClick.bind(this));
    this.container.addEventListener("dblclick", this.handleDBClick.bind(this));
    this.container.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    );
    document.addEventListener("resize", () => {
      this.updateBoardPosition();
    });
    this.container.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private initCustomEventHandler() {
    this._eventEmitter.on("selectStart", this.onSelectStart.bind(this));
    this._eventEmitter.on("createElement", this.onCreateElement.bind(this));
    this._eventEmitter.on("createMove", this.onCreateMove.bind(this));
    this._eventEmitter.on("createEnd", this.onCreateEnd.bind(this));
  }

  private updateBoardPosition() {
    let bbox = this.container.getBoundingClientRect();
    this.boardX = bbox.x;
    this.boardY = bbox.y;
  }

  public exportSvg(): string {
    return "";
  }

  private setSelected(element: BaseElement) {
    this.selected = element;
    // @todo: create new events derived from BoardEvent
    this._cachedEvent.customData = {
      element,
    };
    this._eventEmitter.trigger("elementSelected", [this._cachedEvent]);
  }

  // original events
  protected handleMouseDown(e: MouseEvent) {
    console.log("mouse down...");
    console.log("currentMode: ", this.currentMode);
    console.log("currentInsertMode: ", this.currentInsertMode);
    this.MouseDown = true;
    this.mouseStartX = e.clientX - this.boardX;
    this.mouseStartY = e.clientY - this.boardY;
    // @todo: 元素被点击时，更新 this.selected
    if (this.currentMode === EditorMode.INSERT) {
      this._cachedEvent.mouseEvent = e;
      this._cachedEvent.name = "createElement";
      this._cachedEvent.customData = {
        type: this.currentInsertMode,
        startX: this.mouseStartX,
        startY: this.mouseStartY,
      };
      this._eventEmitter.trigger("createElement", [this._cachedEvent]);
    }
    // 若点击在选中物体范围内则进入拖拽模式(enter drag mode if mouse down on the selected area)
    else if (this.selected && this.clickInSelectedArea(e)) {
      this.currentMode = EditorMode.DRAG;
    } else {
      this.currentMode = EditorMode.SELECT;
      this._cachedEvent.mouseEvent = e;
      this._cachedEvent.name = "selectStart";
      this._eventEmitter.trigger("selectStart", [this._cachedEvent]);
    }
  }
  protected handleMouseUp(e: MouseEvent) {
    console.log("mouse up...");
    this.MouseDown = false;
    if (this.currentMode === EditorMode.INSERT) {
      this._cachedEvent.name = "createEnd";
      this._cachedEvent.mouseEvent = e;
      this._eventEmitter.trigger("createEnd", [this._cachedEvent]);
    } else if (this.currentMode == EditorMode.SELECT) {
      this._cachedEvent.name = "selectEnd";
      this._cachedEvent.mouseEvent = e;
      this._eventEmitter.trigger("selectEnd", [this._cachedEvent]);
    }
    this.currentMode = EditorMode.SELECT;
  }
  protected handleMouseMove(e: MouseEvent) {
    if (this.currentMode === EditorMode.INSERT && this.MouseDown) {
      this._cachedEvent.mouseEvent = e;
      this._cachedEvent.name = "createMove";
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.clientX - this.boardX,
        endY: e.clientY - this.boardY,
      };
      this._eventEmitter.trigger("createMove", [this._cachedEvent]);
    } else if (this.MouseDown) {
      this._cachedEvent.mouseEvent = e;
      this._cachedEvent.name = "selectMove";
      this._cachedEvent.customData = {
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        endX: e.clientX - this.boardX,
        endY: e.clientY - this.boardY,
      };
      this._eventEmitter.trigger("selectMove", [this._cachedEvent]);
    }
  }
  protected handleClick(e: MouseEvent) {
    console.log("mouse click...");
  }
  protected handleDBClick(e: MouseEvent) {
    console.log("mouse double click...");
  }
  protected handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "r":
        this.currentMode = EditorMode.INSERT;
        this.currentInsertMode = InsertMode.RECT;
        break;
      case "o":
        this.currentMode = EditorMode.INSERT;
        this.currentInsertMode = InsertMode.ELLIPSE;
        break;
      case "l":
        this.currentMode = EditorMode.INSERT;
        this.currentInsertMode = InsertMode.LINE;
        break;
      case "v":
        this.currentMode = EditorMode.SELECT;
        this.currentInsertMode = InsertMode.LINE;
        break;
    }
    if (this.currentMode === EditorMode.INSERT) {
      this.container.className = "cursor-crosshair";
    }
  }

  // custom events
  private onSelectStart(e: BoardEvent) {}
  private onSelectMove(e: BoardEvent) {}
  private onSelectEnd(e: BoardEvent) {}

  private onCreateElement(e: BoardEvent) {
    const { mouseEvent, customData } = e;
    switch (customData.type) {
      case InsertMode.RECT:
        let rect = new Rect(customData.startX, customData.startY, 0, 0);
        this.svgcontent.append(rect.domInstance);
        this.elements.push(rect);
        this.setSelected(rect);
        break;
      case InsertMode.ELLIPSE:
        let ellipse = new ELLIPSE(customData.startX, customData.startY, 0, 0);
        this.svgcontent.append(ellipse.domInstance);
        this.elements.push(ellipse);
        this.setSelected(ellipse);
        break;
      default:
        Log.Error("error insert mode");
    }
  }
  private onCreateMove(e: BoardEvent) {
    if (this.container.className) this.container.className = "";
    console.log("handle create move...");
    const { mouseEvent, customData } = e;
    // @todo: handle 移动距离为负数的情况，参考 figma
    let [width, height] = [
      Math.abs(customData.endX - customData.startX),
      Math.abs(customData.endY - customData.startY),
    ];
    this.selected.setFrameWidth(width);
    this.selected.setFrameHeight(height);
    this.selected.transform.e = Math.min(customData.endX, customData.startX);
    this.selected.transform.f = Math.min(customData.endY, customData.startY);
    this.selected.updateRendering();
  }
  private onCreateEnd(e: BoardEvent) {
    console.log("create element end...");
  }

  private clickInSelectedArea(e: MouseEvent) {
    // @todo: complete this
    return false;
  }
}

export enum EditorMode {
  SELECT,
  DRAG,
  INSERT,
  DRAW,
}

export enum InsertMode {
  RECT,
  ELLIPSE,
  LINE,
}

export enum ResizeMode {
  CASUAL,
  SCALE,
}
export class EventHandler {
  private static instance: EventHandler = null;
  private constructor() {}
  static getInstance() {
    if (!EventHandler.instance) {
      EventHandler.instance = new EventHandler();
    }
    return EventHandler.instance;
  }
}
