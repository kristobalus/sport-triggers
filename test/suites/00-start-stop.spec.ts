
import { strict as assert } from "assert"

import { init, stop } from "../helpers/common"
import { TestContext } from "../module"

describe(`start and stop service`, () => {
  const ctx: TestContext = {} as TestContext

  it('should start service', async () => {
    await init(ctx)
    console.log(process.env)
    assert(ctx.service, `service was not started`)
  })

  it(`should stop service`, async () => {
    await stop(ctx)
    assert(ctx.service === undefined, `service was not stopped`)
  })
})
