import { BaseElement } from "./BaseElement"
import { Default } from "./Constant"
import { NS } from "./namespaces"
import { Transform } from "./Transform"
import { setAttr } from "./utilities"

interface EllipseAttr {
  cx: number
  cy: number
  rx: number
  ry: number
}

export class ELLIPSE extends BaseElement {
  private attr: EllipseAttr

  constructor(x: number, y: number, width: number, height: number) {
    super(x, y, width, height)

    this.attr = {
      cx: 0,
      cy: 0,
      rx: 1 / 2,
      ry: 1 / 2,
    }
  }

  protected createDomInstance() {
    const element = document.createElementNS(
      NS.SVG,
      "ellipse"
    ) as SVGEllipseElement
    setAttr(element, this.attr)
    setAttr(element, { fill: Default.fill })
    this._domInstance = element
  }

  public updateAttr() {
    this.attr = {
      cx: 0,
      cy: 0,
      rx: 1 / 2,
      ry: 1 / 2,
    }
  }

  public updateRendering(): void {
    this.updateAttr()
    this.updatePoints()
    this.updateAABB()
    setAttr(this._domInstance, this.attr)
    // svg 渲染椭圆在缩放时中心位置也会跟着缩放，cx, cy设置为 0 可避免该问题，但渲染位置就要做适当的偏移
    let transform = new Transform(1, 0, 0, 1, 1 / 2, 1 / 2).rightMultiply(
      this._transform
    )
    const { a, b, c, d, e, f } = transform
    setAttr(this._domInstance, {
      transform: `matrix(${a},${b},${c},${d},${e},${f})`,
    })
  }

  public onCreateStart(): void {}
  public onCreating(): void {}
  public onCreateEnd(): void {}
}
