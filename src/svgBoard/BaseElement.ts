import { Box } from "./Box"
import { Board } from "./Board"
import { Log } from "./Log"
import { Transform } from "./Transform"
import { Vector2 } from "./Vector"

export abstract class BaseElement {
  protected id: string
  protected board: Board
  protected _domInstance: SVGElement
  public get domInstance(): SVGElement {
    if (!this._domInstance) this.createDomInstance()
    return this._domInstance
  }
  public set domInstance(value: SVGElement) {
    this._domInstance = value
  }
  protected _frameWidth: number
  public get frameWidth(): number {
    return this._frameWidth
  }
  public set frameWidth(value: number) {
    this._frameWidth = value
  }
  protected _frameHeight: number
  public get frameHeight(): number {
    return this._frameHeight
  }
  public set frameHeight(value: number) {
    this._frameHeight = value
  }
  protected absoluteBBox: Box
  protected _transform: Transform
  public get transform(): Transform {
    return this._transform
  }
  public set transform(value: Transform) {
    this._transform = value
  }
  // 元素的 AABB 框，在对元素进行变换时需要更新
  private _AABB: Box
  public get AABB(): Box {
    return this._AABB
  }
  public set AABB(value: Box) {
    this._AABB = value
  }
  // 额外的位置信息（受旋转影响），用于将来绑定编辑面板上元素位置信息，一定要区分它和 transform 的区别
  // 注意旋转，位移，缩放后都要及时更新该信息
  protected position: Vector2
  protected _zIndex: number
  public get zIndex(): number {
    return this._zIndex
  }
  public set zIndex(value: number) {
    this._zIndex = value
  }
  constructor(x: number, y: number, w: number, h: number) {
    this.frameWidth = w
    this.frameHeight = h
    this.transform = Transform.identity()
    this.transform.reset().translate2(x, y)
    this.board = (window as any).board
    this.AABB = new Box(x, y, w, h)
    // @todo: get the right index
    this.zIndex = 0
    // FIX: 点击事件有问题
    // this._domInstance.addEventListener("mousedown", () => {
    //   console.log("---------");
    //   // @todo: 元素是个外部类，从外部去调用 setSelected 有一定的危险性，maybe 可以换成抛出一个【requestSelected】Event？
    //   this.board.setSelected([this]);
    // });

    this.board.eventEmitter.on("createSart", this.onCreateStart.bind(this))
    this.board.eventEmitter.on("creating", this.onCreating.bind(this))
    this.board.eventEmitter.on("createEnd", this.onCreateEnd.bind(this))
  }

  public onCreateStart() {}
  public onCreating() {
    Log.blue("on creating in baseelement")
  }
  public onCreateEnd() {}

  public setFrameWidth(w: number) {
    this.frameWidth = w
  }
  public setFrameHeight(h: number) {
    this.frameHeight = h
  }
  protected abstract createDomInstance(): void
  public abstract updateRendering(): void
}
