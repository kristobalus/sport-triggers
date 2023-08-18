
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

  it('health', async () => {
    const res = await fetch('http://localhost:3000/generic/health')
    const body = await res.json()
    assert(body.data.status === 'ok')
  })

  it('should stop service', async () => {
    await stopContext(ctx)
    assert(ctx.app === undefined, 'service was not stopped')
  })
})
