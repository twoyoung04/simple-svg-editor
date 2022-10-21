import { Transform } from "./Transform"

export class Vector2 {
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
  public get mod() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  constructor(x: number, y: number) {
    this._x = x
    this._y = y
  }

  public static ones() {
    return new Vector2(1, 1)
  }
  public static zeros() {
    return new Vector2(0, 0)
  }
  public add(v: Vector2) {
    this._x += v.x
    this._y += v.y
    return this
  }
  public subtract(v: Vector2) {
    this._x -= v.x
    this._y -= v.y
    return this
  }
  public dotMultiply(v: Vector2) {
    this._x *= v.x
    this._y *= v.y
    return this
  }

  public crossMultiply(v: Vector2) {
    return this._x * v.y - this._y * v.x
  }

  public angle(v: Vector2) {
    return Math.acos(
      Math.min((this._x * v.x + this._y * v.y) / this.mod / v.mod, 1)
    )
  }

  public distance(v: Vector2) {
    return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2))
  }

  public rotateAtOrigin(theta: number) {
    let [x, y] = [
      this.x * Math.cos(theta) - this.y * Math.sin(theta),
      this.x * Math.sin(theta) + this.y * Math.cos(theta),
    ]
    this.x = x
    this.y = y
    return this
  }

  public applyTransform(transform: Transform) {
    const { a, b, c, d, e, f } = transform
    let [x, y] = [a * this.x + c * this.y + e, b * this.x + d * this.y + f]
    this.x = x
    this.y = y
    return this
  }

  public clone() {
    return new Vector2(this.x, this.y)
  }
}
