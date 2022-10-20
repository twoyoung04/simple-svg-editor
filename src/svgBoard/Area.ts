import { Box } from "./BBox";
import { Transform } from "./Transform";

export class Area {
  private _box: Box;
  public get box(): Box {
    return this._box;
  }
  public set box(value: Box) {
    this._box = value;
  }
  private _transform: Transform;
  public get transform(): Transform {
    return this._transform;
  }
  public set transform(value: Transform) {
    this._transform = value;
  }
  constructor(box: Box, tranform: Transform) {
    this.box = box;
    this.transform = tranform;
  }

  public include(x: number, y: number) {
    // @todo: finish this with transform
    const e = this._transform.e;
    const f = this._transform.f;
    const flag =
      x - e >= this.box.x &&
      x - e <= this.box.x + this.box.w &&
      y - f >= this.box.y &&
      y - f <= this.box.y + this.box.h;
    return flag;
  }
}
