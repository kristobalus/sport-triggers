// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import assert from "assert"
import IORedis from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

import { StudioService } from "../src/services/studio.service"
import { CreateTriggerData } from "../src/models/dto/trigger-create-request"
import { TriggerCondition } from "../src/models/entities/trigger-condition"


describe("StudioService", function () {

  const eventName = "football.game.level"
  const eventValue = "start"

  const ctx: {
    triggerId?: string
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

    const trigger = {
      name: "some name, irrelevant for test",
      description: "some description, irrelevant for test",
      datasource: "sportradar",
      scope: "game",
      scopeId: "scopeId"
    } as CreateTriggerData

    const conditions = [
      {
        event: eventName,
        type: "set-and-compare",
        compare: "eq",
        target: eventValue
      }
    ] as Partial<TriggerCondition>[]

    ctx.triggerId = await ctx.service.createTrigger(trigger, conditions)

    assert.ok(ctx.triggerId)
  })

  it(`should be able to get trigger list`, async () => {
    // ctx.service.getTriggerList()
    // assert.ok(ctx.triggerId)
  })

})
