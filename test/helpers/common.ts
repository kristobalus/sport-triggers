import { CoreOptions } from '@microfleet/core-types'
import got from 'got'
import Redis from 'ioredis'

import { TestContext } from '../module'
import { createFleetApp } from "../../src/fleet-app"
import { RouterHapiPluginConfig } from "@microfleet/plugin-router-hapi";

export async function startContext(ctx: TestContext, opts: Partial<CoreOptions> = {}) {
    ctx.service = await createFleetApp(opts)

    const { config } = ctx.service
    const { prefix } = config.routerHapi as RouterHapiPluginConfig

    await ctx.service.connect()

    ctx.request = got.extend({
      prefixUrl: `http://localhost:3000/${prefix}/`
    })
}

export async function stopContext(ctx: TestContext) {
    await ctx.service?.close()
    ctx.service = undefined
    ctx.request = undefined
}

export function flushRedis(ctx: TestContext, _dropIndex?: boolean) {
  return async () => {
    const { redis: { name, sentinels, options } } = ctx.service.config
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

    // if (dropIndex) {
    //   // drop indexes
    //   for (const item of redisIndexDefinitions) {
    //     const indexName = buildIndexName(options.keyPrefix, item.key, item.version)
    //     try {
    //       // @ts-ignore
    //       await redis.call('FT.DROPINDEX', indexName)
    //     } catch (err) {
    //       console.log('Error on dropping %s index', indexName)
    //     }
    //   }
    //   // await redis.flushall()
    //   await redis.quit()
    // }
  }
}
