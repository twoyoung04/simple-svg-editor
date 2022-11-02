import { BaseElement } from "./BaseElement"

export class EventEmitter {
  private callbacks: any

  constructor() {
    this.callbacks = {}
  }

  public on(name: EventType, callback: (e: BoardEvent) => void) {
    const that = this

    if (typeof name === "undefined") {
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

  public off(name: EventType) {
    if (typeof name === "undefined") {
      console.warn("wrong name")
      return false
    }

    if (this.callbacks[name] instanceof Array) {
      delete this.callbacks[name]
    }

    return this
  }

  public trigger(name: EventType, _args: any[]) {
    if (typeof name === "undefined") {
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

export enum EventType {
  MouseDown = "MouseDown",
  MouseMove = "MouseMove",
  MouseUp = "MouseUp",
  KeyDown = "KeyDown",
  SelectStart = "SelectStart",
  Selecting = "Selecting",
  SelectEnd = "SelectEnd",
  CreateStart = "CreateStart",
  Creating = "Creating",
  CreateEnd = "CreateEnd",
  DragStart = "DragStart",
  Draging = "Draging",
  DragEnd = "DragEnd",
  RotateStart = "RotateStart",
  Rotating = "Rotating",
  RotateEnd = "RotateEnd",
  ScaleStart = "ScaleStart",
  Scaling = "Scaling",
  ScaleEnd = "ScaleEnd",
  ChangeMode = "ChangeMode",
  ElementSelected = "ElementSelected",
  NothingSelected = "NothingSelected",
  MouseStatusChange = "MouseStatusChange",

  ElementChangeStart = "ElementChangeStart",
  // 以下这两个事件主要用来区分普通操作和撤销时导致的元素变化区别
  ElementChangeEnd = "ElementChangeEnd",
  ElementChanged = "ElementChanged",

  Undo = "Undo",
  Redo = "Redo",
}

export class BoardEvent {
  private _elements: BaseElement[]
  public get elements(): BaseElement[] {
    return this._elements
  }
  public set elements(value: BaseElement[]) {
    this._elements = value
  }

  private _name: string
  public get name(): string {
    return this._name
  }
  public set name(value: string) {
    this._name = value
  }
  private _originEvent: Event
  public get originEvent(): Event {
    return this._originEvent
  }
  public set originEvent(value: Event) {
    this._originEvent = value
  }
  private _customData: any
  public get customData(): any {
    return this._customData
  }
  public set customData(value: any) {
    this._customData = value
  }
  constructor(name: string, event: Event) {
    this.name = name
    this.originEvent = event
    this.elements = []
  }
}
