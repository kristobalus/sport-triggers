// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis, RedisOptions } from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

import { Scope } from "../src/models/entities/trigger"
import { AdapterService } from "../src/services/adapter/adapter.service"
import { AMQPTransport, Publish } from "@microfleet/transport-amqp"
import { randomUUID } from "crypto"
import { StudioService } from "../src/services/studio/studio.service"

import { Trigger } from "../src/models/entities/trigger"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"
import { initStandaloneRedis } from "./helper/init-standalone-redis"
import { FootballEvents } from "../src/sports/football/football-events"
import { GameLevel } from "../src/sports/football/game-level"
import { EssentialSubscriptionData } from "../src/models/dto/trigger-subscribe-request"
import { QueueService } from "../src/services/queue/queue.service"
import { AdapterEvent } from "../src/models/events/adapter-event"
import { PlayerState as FootballPlayerState } from "../src/sports/football/player-state"
import { Defer } from "../src/utils/defer"
import assert from "assert"

describe("QueueService", function () {

  const scope = Scope.Game
  const scopeId = randomUUID()
  const datasource = "sportradar"
  const entity = "moderation"
  const entityId = randomUUID()
  const playerId = randomUUID()

  const ctx: {
    redis?: Redis,
    redisOptions?: RedisOptions,
    adapter?: AdapterService,
    studio?: StudioService,
    queue?: QueueService,
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection
    subscriptions?: TriggerSubscriptionCollection
    notifications: any[],
    receiver?: EssentialSubscriptionData,
    deferred?: Defer,
    trigger?: Trigger
  } = {
    notifications: [],
  }

  before(async () => {

    ctx.redisOptions = { keyPrefix: "{triggers}" }
    ctx.redis = await initStandaloneRedis(ctx.redisOptions)

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
      level: "info",
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    }))

    const amqp = {
      async publishAndWait<T = any>(route: string, message: any, options?: Publish): Promise<T> {
        ctx.notifications.push({ route, message, options })
        log.debug({ notification: { route, message, options } }, 'notification received')
        return {} as T
      },
    } as AMQPTransport

    ctx.adapter = new AdapterService(log, ctx.redis, amqp, { triggerLifetimeSeconds: 3600 })
    ctx.studio = new StudioService(log, ctx.redis)
    ctx.queue = new QueueService(log, ctx.adapter, ctx.redisOptions)
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptions = new TriggerSubscriptionCollection(ctx.redis)
    ctx.notifications = []

    const triggerData: EssentialTriggerData = {
      name: "...",
      description: "...",
      datasource,
      scope,
      scopeId,
      entity,
      entityId
    }

    const conditionData: EssentialConditionData[] = [
      {
        event: FootballEvents.GamePointsHome,
        compare: CompareOp.GreaterOrEqual,
        targets: [ "30" ],
        options: []
      },
      {
        event: FootballEvents.GameLevel,
        compare: CompareOp.Equal,
        targets: [ GameLevel.End ],
        options: []
      },
      {
        event: FootballEvents.PlayerState,
        compare: CompareOp.Equal,
        targets: [ FootballPlayerState.Touchdown ],
        options: [
          {
            event: FootballEvents.Player,
            compare: CompareOp.Equal,
            targets: [ playerId ]
          }
        ]
      },
    ]

    let triggerId = await ctx.studio.createTrigger(triggerData, conditionData)
    const result = await ctx.studio.getTrigger(triggerId)
    ctx.trigger = result.trigger

    const subscriptionData = {
      ...ctx.receiver,
    } as EssentialSubscriptionData

    await ctx.studio.subscribeTrigger(triggerId, subscriptionData)
    ctx.queue.notificationJobCallback = (result) => {
      ctx.deferred?.resolve(result)
    }
  })

  after(async () => {
    ctx.redis.disconnect()
    await ctx.queue.close()
  })

  it(`complete first condition`, async () => {

    const event: AdapterEvent = {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport: "basketball",
      timestamp: Date.now(),
      options: {
        [FootballEvents.GamePointsHome]: "30"
      }
    }

    ctx.deferred = new Defer<any>()
    await ctx.queue.addEvent(event)
    await ctx.deferred.promise

    const [ condition1, condition2, condition3 ] = await ctx.conditions.getByTriggerId(ctx.trigger.id)
    assert.equal(condition1.activated, true)
    assert.equal(condition2.activated, false)
    assert.equal(condition3.activated, false)
  })

  it(`complete second condition`, async () => {

    const event: AdapterEvent = {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport: "basketball",
      timestamp: Date.now(),
      options: {
        [FootballEvents.GameLevel]: GameLevel.End
      }
    }

    ctx.deferred = new Defer<any>()
    await ctx.queue.addEvent(event)
    await ctx.deferred.promise

    const [ condition1, condition2, condition3 ] = await ctx.conditions.getByTriggerId(ctx.trigger.id)
    assert.equal(condition1.activated, true)
    assert.equal(condition2.activated, true)
    assert.equal(condition3.activated, false)
  })


  it(`complete third condition`, async () => {

    const event: AdapterEvent = {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport: "basketball",
      timestamp: Date.now(),
      options: {
        [FootballEvents.PlayerState]: FootballPlayerState.Touchdown,
        [FootballEvents.Player]: playerId
      }
    }

    ctx.deferred = new Defer<any>()
    await ctx.queue.addEvent(event)
    await ctx.deferred.promise

    const [ condition1, condition2, condition3 ] = await ctx.conditions.getByTriggerId(ctx.trigger.id)
    assert.equal(condition1.activated, true)
    assert.equal(condition2.activated, true)
    assert.equal(condition3.activated, true)
  })

  after(async () => {
    await ctx.queue.close()
    ctx.redis.disconnect()
  })


})
