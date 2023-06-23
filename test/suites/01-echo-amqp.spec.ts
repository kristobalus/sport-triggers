
import { strict as assert } from "assert"

import { startContext, stopContext } from "../helpers/common"
import { TestContext } from "../module"

describe(`echo test via amqp plugin (rabbitmq)`, () => {
  const ctx: TestContext = {} as TestContext

  before(async () => {
    await startContext(ctx)
  })

  after(async () => {
    await stopContext(ctx)
  })

  it('should get pong', async () => {
    assert(ctx.service, `service was not started`)
    const prefix = ctx.service.config.routerAmqp.prefix
    const response = await ctx.service.amqp.publishAndWait(`${prefix}.echo`, { ping: true })

    assert(response)
    assert(response.pong)
    assert(response.pong === true)
  })

  it('should get 403 error', async () => {
    assert(ctx.service, `service was not started`)
    assert(ctx.request, `context has no "got" instance`)
    const prefix = ctx.service.config.routerAmqp.prefix
    const req = ctx.service.amqp.publishAndWait(`${prefix}.echo`, { ping: false })

    await assert.rejects(req, { status: 403 })
  })
})
