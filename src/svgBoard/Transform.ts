export class Transform {
  public a: number;
  public b: number;
  public c: number;
  public d: number;
  public e: number;
  public f: number;

  constructor(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  public static identity() {
    return new Transform(1, 0, 0, 1, 0, 0);
  }
  public static from(o: TransformLike) {
    return new Transform(o.a, o.b, o.c, o.d, o.e, o.f);
  }
  public set(o: TransformLike) {
    this.a = o.a;
    this.b = o.b;
    this.c = o.c;
    this.d = o.d;
    this.e = o.e;
    this.f = o.f;
  }
  public setFromArray(arr: number[]) {
    this.a = arr[0];
    this.b = arr[1];
    this.c = arr[2];
    this.d = arr[3];
    this.e = arr[4];
    this.f = arr[5];
  }
  public clone(t: Transform) {
    return Transform.from(t);
  }
  public reset() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    return this;
  }

  public translate(v: Vector2) {
    this.e += v.x;
    this.f += v.y;
  }

  public translate2(x: number, y: number) {
    this.e += x;
    this.f += y;
  }
  public rotate(radius: number, p: Vector2) {}
}

interface TransformLike {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export class Vector2 {
  private _x: number;
  public get x(): number {
    return this._x;
  }
  public set x(value: number) {
    this._x = value;
  }
  private _y: number;
  public get y(): number {
    return this._y;
  }
  public set y(value: number) {
    this._y = value;
  }
  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  public static ones() {
    return new Vector2(1, 1);
  }
  public static zeros() {
    return new Vector2(0, 0);
  }
  public add(v: Vector2) {
    this._x += v.x;
    this._y += v.y;
  }
  public subtract(v: Vector2) {
    this._x -= v.x;
    this._y -= v.y;
  }
  public dotMultiply(v: Vector2) {
    this._x *= v.x;
    this._y *= v.y;
  }

  public crossMultiply(v: Vector2) {
    return this._x * v.y - this._y * v.x;
  }

  public clone() {
    return new Vector2(this.x, this.y);
  }
}

export class Matrix {}
