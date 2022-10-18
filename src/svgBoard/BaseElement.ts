export abstract class BaseElement {
  protected frameWidth: number;
  protected frameHeight: number;
  constructor(w: number, h: number) {
    this.frameWidth = w;
    this.frameHeight = h;
  }
  public setFrameWidth(w: number) {
    this.frameWidth = w;
  }
  public setFrameHeight(h: number) {
    this.frameHeight = h;
  }

  public abstract updateRendering(): void;
}
