import { BaseElement } from "./BaseElement";
import { NS } from "./namespaces";
import { setAttr } from "./utilities";

export class Rect extends BaseElement {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private fill: string;

  private _domInstance: SVGRectElement;
  public get domInstance(): SVGRectElement {
    if (!this._domInstance) this._domInstance = this.createDomInstance();
    return this._domInstance;
  }
  public set domInstance(value: SVGRectElement) {
    this._domInstance = value;
  }

  constructor(x: number, y: number, width: number, height: number) {
    super(width, height);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  protected createDomInstance() {
    const element = document.createElementNS(NS.SVG, "rect") as SVGRectElement;
    element.setAttribute("x", this.x.toString());
    element.setAttribute("y", this.y.toString());
    element.setAttribute("width", this.width.toString());
    element.setAttribute("height", this.height.toString());
    element.setAttribute("fill", "red");
    return element;
  }

  public updateRendering(): void {
    // @architecture: refractor to DI（改成依赖注入的方式，支持多平台，如 WebGL）
    // @todo: frameWidth，frameHeight + rotation -> width, height
    this.width = this.frameWidth;
    this.height = this.frameHeight;
    setAttr(this._domInstance, {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    });
  }
}
