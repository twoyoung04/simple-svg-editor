import { NS } from "./namespaces";

export class Rect {
  private id: string;
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
}
