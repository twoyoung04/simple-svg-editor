import { Transform } from "../../src/svgBoard/Transform"

import * as mocha from "mocha"
import * as chai from "chai"
import { Vector2 } from "../../src/svgBoard/Vector"

let I = Transform.identity()

const expect = chai.expect

// @todo: test transform
describe("transform", () => {
  it("should scale correctly", () => {
    I.scale(2, 2, Vector2.zeros())
    expect(I.a).to.equal(2)
    expect(I.b).to.equal(0)
    expect(I.c).to.equal(0)
    expect(I.d).to.equal(2)
  })
})
