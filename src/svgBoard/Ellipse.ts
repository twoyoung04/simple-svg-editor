import { BaseElement } from "./BaseElement";
import { NS } from "./namespaces";
import { setAttr } from "./utilities";

interface EllipseAttr {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export class ELLIPSE extends BaseElement {
  private attr: EllipseAttr;

  private _domInstance: SVGEllipseElement;
  public get domInstance(): SVGEllipseElement {
    if (!this._domInstance) this._domInstance = this.createDomInstance();
    return this._domInstance;
  }
  public set domInstance(value: SVGEllipseElement) {
    this._domInstance = value;
  }

  constructor(x: number, y: number, width: number, height: number) {
    super(width, height);
    this.transform.reset().translate2(x, y);
    this.attr = {
      cx: this.transform.e + this.frameWidth / 2,
      cy: this.transform.f + this.frameHeight / 2,
      rx: this.frameWidth / 2,
      ry: this.frameHeight / 2,
    };
  }

  protected createDomInstance() {
    const element = document.createElementNS(
      NS.SVG,
      "ellipse"
    ) as SVGEllipseElement;
    setAttr(element, {
      cx: this.transform.e,
      cy: this.transform.f,
      rx: 0,
      ry: 0,
      fill: "red",
    });
    return element;
  }

  public updateAttr() {
    this.attr = {
      cx: this.transform.e + this.frameWidth / 2,
      cy: this.transform.f + this.frameHeight / 2,
      rx: this.frameWidth / 2,
      ry: this.frameHeight / 2,
    };
  }

  public updateRendering(): void {
    this.updateAttr();
    setAttr(this._domInstance, this.attr);
  }
}
