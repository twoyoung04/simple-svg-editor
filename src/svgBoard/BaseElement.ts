import { Box } from "./Box"
import { Board } from "./Board"
import { Log } from "./Log"
import { Transform } from "./Transform"
import { Vector2 } from "./Vector"
import { Area } from "./Area"
import { generateId } from "./utilities"

export abstract class BaseElement {
  protected _id: string
  public get id(): string {
    return this._id
  }
  public set id(value: string) {
    this._id = value
  }
  protected board: Board
  protected _area: Area
  public get area(): Area {
    return this._area
  }
  public set area(value: Area) {
    this._area = value
  }
  protected _domInstance: SVGElement
  public get domInstance(): SVGElement {
    if (!this._domInstance) this.createDomInstance()
    return this._domInstance
  }
  public set domInstance(value: SVGElement) {
    this._domInstance = value
  }
  public get frameWidth(): number {
    return this.transform.a
  }
  public get frameHeight(): number {
    return this.transform.d
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
    this.id = generateId()
    this.transform = Transform.identity()
    this.transform.a = w
    this.transform.d = h
    this.transform.translate2(x, y)
    this.board = (window as any).board
    this.AABB = new Box(x, y, w, h)
    this.area = new Area(new Box(0, 0, 1, 1), this.transform)
    // @todo: get the right index
    this.zIndex = 0

    this.board.eventEmitter.on("createSart", this.onCreateStart.bind(this))
    this.board.eventEmitter.on("creating", this.onCreating.bind(this))
    this.board.eventEmitter.on("createEnd", this.onCreateEnd.bind(this))
  }

  public onCreateStart() {}
  public onCreating() {
    Log.blue("on creating in baseelement")
  }
  public onCreateEnd() {}

  // public setFrameWidth(w: number) {
  //   this.frameWidth = w
  // }
  // public setFrameHeight(h: number) {
  //   this.frameHeight = h
  // }
  protected abstract createDomInstance(): void
  public abstract updateRendering(): void
}
