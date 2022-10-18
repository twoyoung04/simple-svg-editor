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
      cx: this.frameWidth / 2,
      cy: this.frameHeight / 2,
      rx: this.frameWidth / 2,
      ry: this.frameHeight / 2,
    };
  }

  protected createDomInstance() {
    const element = document.createElementNS(
      NS.SVG,
      "ellipse"
    ) as SVGEllipseElement;
    setAttr(element, this.attr);
    setAttr(element, { fill: "red" });
    return element;
  }

  public updateAttr() {
    this.attr = {
      cx: this.frameWidth / 2,
      cy: this.frameHeight / 2,
      rx: this.frameWidth / 2,
      ry: this.frameHeight / 2,
    };
  }

  public updateRendering(): void {
    this.updateAttr();
    setAttr(this._domInstance, this.attr);
    const { a, b, c, d, e, f } = this._transform;
    setAttr(this._domInstance, {
      transform: `matrix(${a},${b},${c},${d},${e},${f})`,
    });
  }
}
