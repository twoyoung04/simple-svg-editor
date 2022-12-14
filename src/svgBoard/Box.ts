import { Vector2 } from "./Vector"

export class Box {
  private _x: number
  public get x(): number {
    return this._x
  }
  public set x(value: number) {
    this._x = value
  }
  private _y: number
  public get y(): number {
    return this._y
  }
  public set y(value: number) {
    this._y = value
  }
  private _w: number
  public get w(): number {
    return this._w
  }
  public set w(value: number) {
    this._w = value
  }
  private _h: number
  public get h(): number {
    return this._h
  }
  public set h(value: number) {
    this._h = value
  }
  public get x2(): number {
    return this._x + this._w
  }
  public get y2(): number {
    return this._y + this._h
  }
  constructor(x: number, y: number, w: number, h: number) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }
  public set(box: Box) {
    this.x = box.x
    this.y = box.y
    this.w = box.w
    this.h = box.h
  }
  public set4(x: number, y: number, w: number, h: number) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }
  public setSize(w: number, h: number) {
    this.w = w
    this.h = h
  }
  public clone() {
    return new Box(this.x, this.y, this._w, this._h)
  }
  public merge(box: Box) {}
  public static mergeAll(boxes: Box[]) {
    if (boxes.length == 0) return null
    if (boxes.length == 1) return boxes[0]
    let minx = Math.min(...boxes.map((b) => b.x))
    let maxx = Math.max(...boxes.map((b) => b.x + b.w))
    let miny = Math.min(...boxes.map((b) => b.y))
    let maxy = Math.max(...boxes.map((b) => b.y + b.h))
    return new Box(minx, miny, maxx - minx, maxy - miny)
  }

  public center() {
    return new Vector2(this.x + this.w / 2, this.y + this.h / 2)
  }

  public toVector2() {
    return [
      new Vector2(this.x, this.y),
      new Vector2(this.x, this.y2),
      new Vector2(this.x2, this.y2),
      new Vector2(this.x2, this.y),
    ]
  }
}
