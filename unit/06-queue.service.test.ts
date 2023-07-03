// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

import { Scope } from "../src/models/entities/trigger"
import { AdapterService } from "../src/services/adapter/adapter.service"
import { AMQPTransport, Publish } from "@microfleet/transport-amqp"
import { randomUUID } from "crypto"
import { StudioService } from "../src/services/studio/studio.service"
// import assert from "assert"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { FootballGamePointsHomeEvent } from "../src/models/events/football/football-game-points-home.event"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"
import { initStandaloneRedis } from "./helper/init-standalone-redis"
import { FootballEvents } from "../src/models/events/football/football-events"
import { GameLevel } from "../src/models/events/football/football-game-level.event"
import { EssentialSubscriptionData } from "../src/models/dto/trigger-subscribe-request"
import { QueueService } from "../src/services/queue/queue.service"
import { delay  } from "bluebird"

describe("QueueService", function () {

  const scope = Scope.SportradarGames
  const scopeId = randomUUID()

  const ctx: {
    redis?: Redis,
    adapter?: AdapterService,
    studio?: StudioService,
    queue?: QueueService,
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection
    subscriptions?: TriggerSubscriptionCollection
    notifications: any[],
    receiver?: EssentialSubscriptionData
  } = {
    notifications: [],
  }

  before(async () => {

    ctx.redis = await initStandaloneRedis()
    await ctx.redis.flushall()

    ctx.receiver = {
      route: 'trigger.receiver',
      payload: { id: 1 },
      entity: 'question',
      entityId: '50',
      options: {},
    }

    const log = pino({
      name: "test",
      level: "debug",
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    }))

    const amqp = {
      async publishAndWait<T = any>(route: string, message: any, options?: Publish): Promise<T> {
        ctx.notifications.push({ route, message, options })
        return {} as T
      },
    } as AMQPTransport

    ctx.adapter = new AdapterService(log, ctx.redis, amqp)
    ctx.studio = new StudioService(log, ctx.redis)
    ctx.queue = new QueueService(log, ctx.adapter, {})
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptions = new TriggerSubscriptionCollection(ctx.redis)
    ctx.notifications = []

    const triggerData = {
      name: "...",
      description: "...",
      scope,
      scopeId,
    } as EssentialTriggerData

    const triggerConditions: EssentialConditionData[] = [
      {
        event: FootballEvents.GamePointsHome,
        compare: CompareOp.GreaterOrEqual,
        target: "30",
      },
      {
        event: FootballEvents.GameLevel,
        compare: CompareOp.Equal,
        target: GameLevel.End,
      },
    ]

    let triggerId = await ctx.studio.createTrigger(triggerData, triggerConditions)

    const subscriptionData = {
      ...ctx.receiver,
    } as EssentialSubscriptionData

    await ctx.studio.subscribeTrigger(triggerId, subscriptionData)
  })

  after(async () => {
    ctx.redis.disconnect()
    await ctx.queue.close()
  })

  // it.skip(`direct event push`, async () => {
  //
  //   const event = {
  //     name: FootballEvents.GamePointsHome,
  //     id: randomUUID(),
  //     value: "20",
  //     scope,
  //     scopeId,
  //     timestamp: Date.now(),
  //   } as FootballGamePointsHomeEvent
  //
  //   await ctx.adapter.pushEvent(event)
  //   const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(triggerId)
  //   assert.equal(condition1.activated, false)
  //   assert.equal(condition2.activated, false)
  // })

  it(`use event queue`, async () => {

    const event = {
      name: FootballEvents.GamePointsHome,
      id: randomUUID(),
      value: "30",
      scope,
      scopeId,
      timestamp: Date.now(),
    } as FootballGamePointsHomeEvent

    await ctx.queue.addEvent(event)

    // TODO replace for a waiting of trigger activation
    await delay(5000)
  })

  // it.skip(`event for first, first - activated, second - not`, async () => {
  //
  //   const event = {
  //     name: FootballEvents.GamePointsHome,
  //     value: "40",
  //     id: randomUUID(),
  //     scope,
  //     scopeId,
  //     timestamp: Date.now(),
  //   } as FootballGamePointsHomeEvent
  //
  //   await ctx.adapter.pushEvent(event)
  //   const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(triggerId)
  //   assert.equal(condition1.activated, true)
  //   assert.equal(condition2.activated, false)
  // })
  //
  // it.skip(`event for second, first - activated, second - not`, async () => {
  //
  //   const event = {
  //     name: FootballEvents.GameLevel,
  //     value: GameLevel.Start,
  //     id: randomUUID(),
  //     scope,
  //     scopeId,
  //     timestamp: Date.now(),
  //   } as FootballGameLevelEvent
  //
  //   await ctx.adapter.pushEvent(event)
  //   const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(triggerId)
  //   assert.equal(condition1.activated, true)
  //   assert.equal(condition2.activated, false)
  // })
  //
  // it.skip(`event for second, second - activated, first - activated, trigger - activated`, async () => {
  //
  //   const event = {
  //     name: FootballEvents.GameLevel,
  //     value: GameLevel.End,
  //     id: randomUUID(),
  //     scope,
  //     scopeId,
  //     timestamp: Date.now(),
  //   } as FootballGameLevelEvent
  //
  //   await ctx.adapter.pushEvent(event)
  //
  //   const conditions = await ctx.conditions.getByTriggerId(triggerId)
  //   assert.equal(conditions.length, 0)
  //
  //   const [ notification ] = ctx.notifications
  //   assert.equal(ctx.notifications.length, 1)
  //   assert.equal(notification.route, "some.route2")
  // })

})
