import { BaseElement } from "./BaseElement";
import { Default } from "./Constant";
import { NS } from "./namespaces";
import { setAttr } from "./utilities";

interface RectAttr {
  x: number;
  y: number;
  width: number;
  height: number;
}
export class Rect extends BaseElement {
  private attr: RectAttr;

  // public get domInstance(): SVGRectElement {
  //   if (!this._domInstance) this._domInstance = this.createDomInstance();
  //   return this._domInstance;
  // }
  // public set domInstance(value: SVGRectElement) {
  //   this._domInstance = value;
  // }

  constructor(x: number, y: number, width: number, height: number) {
    super(x, y, width, height);
    this.attr = {
      x: 0,
      y: 0,
      width: width,
      height: height,
    };
  }

  protected createDomInstance() {
    const element = document.createElementNS(NS.SVG, "rect") as SVGRectElement;
    setAttr(element, this.attr);
    setAttr(element, { fill: Default.fill });
    this._domInstance = element;
  }

  public updateAttr() {
    this.attr.width = this.frameWidth;
    this.attr.height = this.frameHeight;
  }

  private updateAABB() {
    this.AABB.setSize(this.frameWidth, this.frameHeight);
  }

  public updateRendering(): void {
    // @architecture: refractor to DI（改成依赖注入的方式，支持多平台，如 WebGL）
    // @todo: frameWidth，frameHeight + rotation -> width, height
    this.updateAttr();
    setAttr(this._domInstance, this.attr);
    const { a, b, c, d, e, f } = this._transform;
    setAttr(this._domInstance, {
      transform: `matrix(${a},${b},${c},${d},${e},${f})`,
    });
  }

  // public onCreateStart(): void {}
  public onCreating() {
    this.updateAABB();
  }
  // public onCreateEnd(): void {}
}
