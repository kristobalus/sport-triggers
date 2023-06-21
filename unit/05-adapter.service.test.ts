// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import IORedis, { Redis, RedisOptions } from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

// import assert from "assert"
import { Trigger } from "../src/models/entities/trigger"
import { AdapterService } from "../src/services/adapter.service"
import { AMQPTransport, Publish } from "@microfleet/transport-amqp"
import { randomUUID } from "crypto"
import { StudioService } from "../src/services/studio.service"
import assert from "assert"
import { CreateTriggerData } from "../src/models/dto/trigger-create-request"
import { TriggerCondition } from "../src/models/entities/trigger-condition"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import path from "path"
import fs from "fs"
import { FootballGamePointsHomeEvent } from "../src/models/events/football/football-game-points-home.event"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"
import { TriggerSubscription } from "../src/models/entities/trigger-subscription"

describe("AdapterService", function () {

  // @ts-ignore
  const EVENT_GAME_LEVEL = "football.game.level"
  const EVENT_HOME_POINTS = "football.game.points.home"
  // @ts-ignore
  const EVENT_VALUE_GAME_START = "start"
  const EVENT_VALUE_HOME_POINTS = 10
  const EVENT_VALUE_HOME_POINTS_TARGET = 20
  const EVENT_ID = randomUUID()
  const SCOPE_ID = randomUUID()
  const SCOPE = "game"
  const CONDITION_TYPE_SET_AND_COMPARE = "set_and_compare"

  const ctx: {
    triggerId?: string,
    trigger?: Trigger,
    redis?: Redis,
    adapterService?: AdapterService,
    studioService?: StudioService,
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection
    subscriptions?: TriggerSubscriptionCollection
  } = {}

  before(async () => {

    ctx.redis = new IORedis({} as RedisOptions)
    ctx.redis.defineCommand("set_and_compare", {
      numberOfKeys: 1,
      lua: fs.readFileSync(path.resolve(__dirname, '../lua/set_and_compare.lua')).toString("utf-8")
    })
    await ctx.redis.flushall()

    const log = pino({
      name: "AdapterService",
      level: "info"
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    }))

    const amqp = {
      async publishAndWait<T = any>(_route: string, _message: any, _options?: Publish): Promise<T> {
        console.log(_route, _message, _options)
        return {} as T
      }
    } as AMQPTransport

    ctx.adapterService = new AdapterService(log, ctx.redis, amqp)
    ctx.studioService = new StudioService(log, ctx.redis)
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptions = new TriggerSubscriptionCollection(ctx.redis)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`studio should create trigger and set conditions`, async () => {

    const trigger = {
      name: "...",
      description: "...",
      datasource: "sportradar",
      scope: SCOPE,
      scopeId: SCOPE_ID
    } as CreateTriggerData

    const conditions = [
      {
        event: EVENT_HOME_POINTS,
        type: CONDITION_TYPE_SET_AND_COMPARE,
        compare: "eq",
        target: EVENT_VALUE_HOME_POINTS_TARGET
      }
    ] as Partial<TriggerCondition>[]

    ctx.triggerId = await ctx.studioService.createTrigger(trigger, conditions)
    assert.ok(ctx.triggerId)

    ctx.trigger = await ctx.triggers.getOneById(ctx.triggerId)
    assert.ok(ctx.trigger)
    assert.equal(ctx.triggerId, ctx.trigger.id)

    const triggers = await ctx.conditions.findTriggersByScopeAndEvent(SCOPE, SCOPE_ID, EVENT_HOME_POINTS)
    assert.ok(triggers)
    assert.equal(triggers.length, 1)
    assert.equal(triggers.indexOf(ctx.triggerId), 0)

    console.log(ctx.triggerId)

    const subscriptionId = await ctx.subscriptions.create(ctx.triggerId, {
      triggerId: ctx.triggerId,
      route: "some.route",
      payload: { foo: "bar" }
    } as Partial<TriggerSubscription>)

    const subscription = await ctx.subscriptions.getOne(subscriptionId)
    console.log(subscription)
  })

  it(`adapter should push event into processing`, async () => {

    const event = {
      name: EVENT_HOME_POINTS,
      value: EVENT_VALUE_HOME_POINTS,
      id: EVENT_ID,
      datasource: "sportradar",
      scope: SCOPE,
      scopeId: SCOPE_ID,
      timestamp: Date.now()
    } as FootballGamePointsHomeEvent

    await ctx.adapterService.pushEvent(event)
  })



})
