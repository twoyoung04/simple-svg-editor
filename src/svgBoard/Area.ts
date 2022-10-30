import { Box } from "./Box"
import { Transform } from "./Transform"
import { Vector2 } from "./Vector"

export class Area {
  private _box: Box
  public get box(): Box {
    return this._box
  }
  public set box(value: Box) {
    this._box = value
  }
  private _transform: Transform
  public get transform(): Transform {
    return this._transform
  }
  public set transform(value: Transform) {
    this._transform = value
  }
  constructor(box: Box, tranform: Transform) {
    this.box = box
    this.transform = tranform
  }

  public clone() {
    return new Area(this.box.clone(), this.transform.clone())
  }

  public include(p: Vector2) {
    // @todo: finish this with transform
    let pp = p.clone().applyTransform(this._transform.inverse())
    // debugger
    return (
      pp.x < this.box.x2 &&
      pp.x > this.box.x &&
      pp.y < this.box.y2 &&
      pp.y > this.box.y
    )
  }

  public nearestCornerDistance(p: Vector2) {
    // 逆时针顺序
    let corners = [
      new Vector2(this.box.x, this.box.y),
      new Vector2(this.box.x, this.box.y2),
      new Vector2(this.box.x2, this.box.y2),
      new Vector2(this.box.x2, this.box.y),
    ]
    let distances = corners
      .map((c) => c.applyTransform(this._transform))
      .map((c) => c.distance(p))
    return distances
  }

  public center() {
    return this.box.center().clone().applyTransform(this.transform)
  }
}
