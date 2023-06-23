
import { CoreOptions } from "@microfleet/core-types"

import { strict as assert } from "assert"

import { HTTPError } from "got"

import { startContext, stopContext } from "../helpers/common"
import { TestContext } from "../module"

describe(`echo test via hapi (http)`, () => {
  const ctx: TestContext = {} as TestContext

  before(async () => {
    await startContext(ctx, {
      hapi: {
        server: {
          debug: {
            log: ['my-log-tag'],
            request: ['my-request-tag']
          }
        }
      }
    } as Partial<CoreOptions>)
  })

  after(async () => {
    await stopContext(ctx)
  })

  it('should get pong via http', async () => {
    assert(ctx.request, `context has no got instance`)
    const res = await ctx.request.post("echo", {
      json: { ping: true }
    })

    assert(res)
    assert(res.body)
    const doc = JSON.parse(res.body)

    assert(doc.pong === true, "pong should be positive boolean")
  })

  it('should get 403 error via http', async () => {
    assert(ctx.request, `context has no got instance`)
    const req = ctx.request.post("echo", {
      json: { ping: false }
    })

    await assert.rejects(req, (err: HTTPError) => {
      assert.equal(err.response.statusCode, 403)

      return true
    })
  })
})
