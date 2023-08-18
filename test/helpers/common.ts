import { CoreOptions } from '@microfleet/core-types'
import got from 'got'
import Redis from 'ioredis'

import { TestContext } from '../module'
import { createFleetApp } from "../../src/fleet-app"
import { RouterHapiPluginConfig } from "@microfleet/plugin-router-hapi";

export async function startContext(ctx: TestContext, opts: Partial<CoreOptions> = {}) {
    ctx.app = await createFleetApp(opts)

    const { config } = ctx.app
    let { prefix } = config.routerHapi as RouterHapiPluginConfig

    await ctx.app.connect()

   if ( prefix ) {
     prefix = prefix + "/"
   }

    ctx.request = got.extend({
      prefixUrl: `http://localhost:3000/${prefix}`
    })
}

export async function stopContext(ctx: TestContext) {
    await ctx.app?.close()
    ctx.app = undefined
    ctx.request = undefined
}

export function flushRedis(ctx: TestContext, _dropIndex?: boolean) {
  return async () => {
    const { redis: { name, sentinels, options } } = ctx.app.config
    const redis = new Redis({
      name,
      sentinels,
      ...options,
      keyPrefix: "",
      lazyConnect: true,
    })

    const keys = await redis.keys("*")

    for (const key of keys) {
      await redis.del(key)
    }
  }
}
