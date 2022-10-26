export class EventEmitter {
  private callbacks: any

  constructor() {
    this.callbacks = {}
  }

  // @todo: define type of callbacks
  public on(name: string, callback: (e: BoardEvent) => void) {
    const that = this

    if (typeof name === "undefined" || name === "") {
      console.warn("wrong names")
      return false
    }

    if (typeof callback === "undefined") {
      console.warn("wrong callback")
      return false
    }

    ;(that.callbacks[name] || (that.callbacks[name] = [])).push(callback)

    return this
  }

  public off(name: string) {
    if (typeof name === "undefined" || name === "") {
      console.warn("wrong name")
      return false
    }

    if (this.callbacks[name] instanceof Array) {
      delete this.callbacks[name]
    }

    return this
  }

  trigger(name: string, _args: any[]) {
    if (typeof name === "undefined" || name === "") {
      console.warn("wrong name")
      return false
    }
    const args = !(_args instanceof Array) ? [] : _args

    if (!this.callbacks[name]) return
    this.callbacks[name].forEach((callback) => {
      callback.apply(this, args)
    })
  }
}

export class BoardEvent {
  private _name: string
  public get name(): string {
    return this._name
  }
  public set name(value: string) {
    this._name = value
  }
  private _mouseEvent: MouseEvent
  public get mouseEvent(): MouseEvent {
    return this._mouseEvent
  }
  public set mouseEvent(value: MouseEvent) {
    this._mouseEvent = value
  }
  private _customData: any
  public get customData(): any {
    return this._customData
  }
  public set customData(value: any) {
    this._customData = value
  }
  constructor(name: string, mouseEvent: MouseEvent) {
    this.name = name
    this.mouseEvent = mouseEvent
  }
}
