// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

// import assert from "assert"
import { Datasource, Scope, Trigger } from "../src/models/entities/trigger"
import { AdapterService } from "../src/services/adapter.service"
import { AMQPTransport, Publish } from "@microfleet/transport-amqp"
import { randomUUID } from "crypto"
import { StudioService } from "../src/services/studio.service"
import assert from "assert"
import { CreateTriggerData } from "../src/models/dto/trigger-create-request"
import { CompareOp, ConditionTypes, TriggerCondition } from "../src/models/entities/trigger-condition"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { FootballGamePointsHomeEvent } from "../src/models/events/football/football-game-points-home.event"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"
import { CreateSubscriptionData } from "../src/models/entities/trigger-subscription"
import { initRedis } from "./helper/init-redis"
import { FootballEvents } from "../src/models/events/football/football-events"

describe("AdapterService", function () {

  const scope = Scope.Game
  const datasource = Datasource.Sportradar
  const scopeId = randomUUID()

  const ctx: {
    triggerId?: string,
    subscriptionId?: string,
    trigger?: Trigger,
    redis?: Redis,
    adapterService?: AdapterService,
    studioService?: StudioService,
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection
    subscriptions?: TriggerSubscriptionCollection
    notifications: any[]
  } = {
    notifications: [],
  }

  before(async () => {

    ctx.redis = await initRedis()

    const log = pino({
      name: "AdapterService",
      level: "info",
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    }))

    const amqp = {
      async publishAndWait<T = any>(route: string, message: any, options?: Publish): Promise<T> {
        console.log({ route, message, options })
        ctx.notifications.push({ route, message, options })
        return {} as T
      },
    } as AMQPTransport

    ctx.adapterService = new AdapterService(log, ctx.redis, amqp)
    ctx.studioService = new StudioService(log, ctx.redis)
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptions = new TriggerSubscriptionCollection(ctx.redis)

    const triggerData = {
      name: "...",
      description: "...",
      datasource,
      scope,
      scopeId,
    } as CreateTriggerData

    const triggerConditions = [
      {
        event: FootballEvents.GamePointsHome,
        type: ConditionTypes.SetAndCompare,
        compare: CompareOp.GreaterOrEqual,
        target: 30,
      },
    ] as Partial<TriggerCondition>[]

    ctx.triggerId = await ctx.studioService.createTrigger(triggerData, triggerConditions)

    const subscriptionData = {
      route: "some.route",
      payload: { foo: "bar" }
    } as CreateSubscriptionData

    ctx.subscriptionId = await ctx.studioService.subscribeTrigger(ctx.triggerId, subscriptionData)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`adapter pushes event with value under threshold, trigger should not be activated`, async () => {

    const event = {
      name: FootballEvents.GamePointsHome,
      id: randomUUID(),
      value: 20,
      datasource,
      scope,
      scopeId,
      timestamp: Date.now(),
    } as FootballGamePointsHomeEvent

    await ctx.adapterService.pushEvent(event)
    assert.equal(ctx.notifications.length, 0)
  })

  it(`adapter pushes event with value above threshold, trigger should be activated`, async () => {

    const event = {
      name: FootballEvents.GamePointsHome,
      value: 40,
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now(),
    } as FootballGamePointsHomeEvent

    await ctx.adapterService.pushEvent(event)
    assert.equal(ctx.notifications.length, 1)
  })

})
