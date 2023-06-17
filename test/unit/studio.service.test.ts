
// import assert from "assert"
import IORedis from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

import { StudioService } from "../../src/services/studio.service"

describe("StudioService", function () {
  const ctx: {
    service?: StudioService
  } = {}

  before(async () => {
    const redis = new IORedis()
    const stream = pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    });
    const log = pino({
      name: "StudioService",
      level: "debug"
    }, stream)
    ctx.service = new StudioService(log, redis)
  })

  it(`should create trigger`, async () => {
    const result = await ctx.service.createTrigger({
      name: "home points 30+",
      description: "should trigger when home points reach 30 or more",
      datasource: "sportradar",
      scope: "game",
      scopeId: "d8539eb6-3e27-40c8-906f-9cd1736321d8",
      conditions: [
        {
          event: "game.home_points",
          type: "set-and-compare",
          compare: "ge",
          target: 30
        }
      ]
    })

    console.log(result)
  })
})
