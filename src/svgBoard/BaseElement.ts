import { Transform, Vector2 } from "./Transform";

export abstract class BaseElement {
  protected id: string;
  protected _frameWidth: number;
  public get frameWidth(): number {
    return this._frameWidth;
  }
  public set frameWidth(value: number) {
    this._frameWidth = value;
  }
  protected _frameHeight: number;
  public get frameHeight(): number {
    return this._frameHeight;
  }
  public set frameHeight(value: number) {
    this._frameHeight = value;
  }
  protected absoluteBBox: BBOX;
  protected _transform: Transform;
  public get transform(): Transform {
    return this._transform;
  }
  public set transform(value: Transform) {
    this._transform = value;
  }
  // 额外的位置信息（受旋转影响），用于将来绑定编辑面板上元素位置信息，一定要区分它和 transform 的区别
  // 注意旋转，位移，缩放后都要及时更新该信息
  protected position: Vector2;
  protected zIndex: number;
  constructor(w: number, h: number) {
    this.frameWidth = w;
    this.frameHeight = h;
    this.transform = Transform.identity();
  }
  public setFrameWidth(w: number) {
    this.frameWidth = w;
  }
  public setFrameHeight(h: number) {
    this.frameHeight = h;
  }

  public abstract updateRendering(): void;
}

export class BBOX {}
