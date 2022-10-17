import { NS } from "./namespaces";

export class Board {
  private saveOptions: any;
  private selected: Element;
  private plugins: any[];
  private currentMode: EditorMode;
  private currentResizeMode: ResizeMode;
  private rubberBox: any;
  private curBBoxes: any[];
  private selector: Selector;
  private container: any;
  private svgdoc: any;
  private svgroot: SVGElement;
  private svgcontent: SVGElement;
  public static idPrefix = "svg";
  private curConfig: any;

  constructor(container: any) {
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
    // @todo: 创建实例，并未添加任何东西
    this.selector = new Selector();
    this.container = container;
    this.svgdoc = document;
    this.svgroot = this.svgdoc.createElementNS(NS.SVG, "svg");
    this.svgroot.setAttributeNS;
    console.log(this.svgroot);
    this.container.append(this.svgroot);
  }

  public exportSvg(): string {
    return "";
  }
}

export enum EditorMode {
  SELECT,
}

export enum ResizeMode {
  CASUAL,
  SCALE,
}

export class Element {}

export class Selector {
  constructor() {}
  public init() {}
}
