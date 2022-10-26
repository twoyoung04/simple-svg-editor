import { Vector2 } from "./Vector"

export class Transform {
  public a: number
  public b: number
  public c: number
  public d: number
  public e: number
  public f: number

  constructor(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ) {
    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.e = e
    this.f = f
  }

  public static identity() {
    return new Transform(1, 0, 0, 1, 0, 0)
  }
  public static from(o: TransformLike) {
    return new Transform(o.a, o.b, o.c, o.d, o.e, o.f)
  }
  public set(o: TransformLike) {
    this.a = o.a
    this.b = o.b
    this.c = o.c
    this.d = o.d
    this.e = o.e
    this.f = o.f
  }
  public setFromArray(arr: number[]) {
    this.a = arr[0]
    this.b = arr[1]
    this.c = arr[2]
    this.d = arr[3]
    this.e = arr[4]
    this.f = arr[5]
  }
  public copy(t: Transform) {
    this.a = t.a
    this.b = t.b
    this.c = t.c
    this.d = t.d
    this.e = t.e
    this.f = t.f
    return this
  }
  public clone() {
    return Transform.from(this)
  }
  public reset() {
    this.a = 1
    this.b = 0
    this.c = 0
    this.d = 1
    this.e = 0
    this.f = 0
    return this
  }

  public translate(v: Vector2) {
    return this.translate2(v.x, v.y)
  }
  public translate2(x: number, y: number) {
    this.e += x
    this.f += y
    return this
    // return this.rightMultiply(new Transform(1, 0, 0, 1, x, y))
  }
  // @todo: 写该类的测试
  public rotateAtOrigin(radius: number) {
    let [sina, cosa] = [Math.sin(radius), Math.cos(radius)]
    return this.rightMultiply(new Transform(cosa, sina, -sina, cosa, 0, 0))
  }
  public rotate(radius: number, p: Vector2) {
    // T1 * R * T2 * CTM（平移旋转再平移）
    return this.translate(Vector2.zeros().subtract(p))
      .rotateAtOrigin(radius)
      .translate(p)
  }

  public scale(x: number, y: number, p: Vector2) {
    return this.copy(
      Transform.identity()
        .translate(p.opposite())
        .scaleAtOrigin(x, y)
        .translate(p)
        .rightMultiply(this)
    )
  }
  public scale2(x: number, y: number, p: Vector2) {
    return this.translate(p.opposite()).scale2AtOrigin(x, y).translate(p)
  }
  public scale2AtOrigin(x: number, y: number) {
    return this.rightMultiply(new Transform(x, 0, 0, y, 0, 0))
  }

  public scaleAtOrigin(x, y) {
    this.a *= x
    this.e *= x
    this.d *= y
    this.f *= y
    return this
  }

  public flipY() {
    const { a, b, c, d, e, f } = this
    let [x, y] = [1 / 2, 1 / 2]
    let [x1, y1] = [a * x + c * y + e, b * x + d * y + f]
    this.rightMultiply(new Transform(-1, 0, 0, 1, 0, 0)).translate2(2 * x1, 0)
    return this
  }

  // 原矩阵在右边👉
  public rightMultiply(tm: Transform) {
    let a = tm.a * this.a + tm.c * this.b
    let b = tm.b * this.a + tm.d * this.b
    let c = tm.a * this.c + tm.c * this.d
    let d = tm.b * this.c + tm.d * this.d
    let e = tm.a * this.e + tm.c * this.f + tm.e
    let f = tm.b * this.e + tm.d * this.f + tm.f
    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.e = e
    this.f = f
    return this
  }
  public leftMultiply(tm: Transform) {}

  // 矩阵的逆
  public inverse() {
    let { a, b, c, d, e, f } = this
    let detA = a * d - b * c
    return new Transform(
      d / detA,
      -b / detA,
      -c / detA,
      a / detA,
      (c * f - d * e) / detA,
      (b * e - a * f) / detA
    )
  }

  // @todo: 放在此处不太规范，耦合性太强
  public cssString() {
    return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`
  }
}

interface TransformLike {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export class Matrix {}
