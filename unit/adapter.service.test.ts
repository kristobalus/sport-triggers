// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import IORedis from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

// import assert from "assert"
import { Trigger } from "../src/models/entities/trigger"
import { AdapterService } from "../src/services/adapter.service"
import { AMQPTransport, Publish } from "@microfleet/transport-amqp"
import { FootballGameLevelEvent } from "../src/models/events/football/football-game-level.event"
import { randomUUID } from "crypto"
import { StudioService } from "../src/services/studio.service"
import assert from "assert"
import { CreateTriggerData } from "../src/models/dto/trigger-create-request"
import { TriggerCondition } from "../src/models/entities/trigger-condition"

describe("AdapterService", function () {

  const eventName = "football.game.level"
  const eventValue = "start"
  const eventId = randomUUID()
  const scopeId = randomUUID()

  const ctx: {
    triggerId?: string,
    trigger?: Trigger,
    adapterService?: AdapterService,
    studioService?: StudioService
  } = {}

  before(async () => {

    const redis = new IORedis()

    const log = pino({
      name: "AdapterService",
      level: "debug"
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    }))

    const amqp = {
      async publishAndWait<T = any>(_route: string, _message: any, _options?: Publish): Promise<T> {
        return {} as T
      }
    } as AMQPTransport

    ctx.adapterService = new AdapterService(log, redis, amqp)
    ctx.studioService = new StudioService(log, redis)
  })

  it(`studio should create trigger and set conditions`, async () => {

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

    ctx.triggerId = await ctx.studioService.createTrigger(trigger, conditions)

    assert.ok(ctx.triggerId)
  })

  it(`adapter should push event into processing`, async () => {
    const event = {
      name: eventName,
      value: eventValue,
      id: eventId,
      datasource: "sportradar",
      scope: "game",
      scopeId: scopeId,
      timestamp: Date.now()
    } as FootballGameLevelEvent
    await ctx.adapterService.pushEvent(event)
  })



})
