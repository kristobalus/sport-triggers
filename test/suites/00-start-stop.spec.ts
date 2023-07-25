
import { strict as assert } from 'assert'

import { startContext, stopContext } from '../helpers/common'
import { TestContext } from '../module'

describe('start and stop service', () => {
  const ctx: TestContext = {} as TestContext

  it('should start service', async () => {
    await startContext(ctx)
    // console.log(process.env)
    assert(ctx.app, 'service was not started')
  })

  it('should stop service', async () => {
    await stopContext(ctx)
    assert(ctx.app === undefined, 'service was not stopped')
  })
})
