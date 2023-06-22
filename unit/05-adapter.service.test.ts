// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

import { Datasource, Scope } from "../src/models/entities/trigger"
import { AdapterService } from "../src/services/adapter/adapter.service"
import { AMQPTransport, Publish } from "@microfleet/transport-amqp"
import { randomUUID } from "crypto"
import { StudioService } from "../src/services/studio/studio.service"
import assert from "assert"
import { EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { CompareOp, ConditionType, TriggerCondition } from "../src/models/entities/trigger-condition"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { FootballGamePointsHomeEvent } from "../src/models/events/football/football-game-points-home.event"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"
import { CreateSubscriptionData } from "../src/models/entities/trigger-subscription"
import { initStandaloneRedis } from "./helper/init-standalone-redis"
import { FootballEvents } from "../src/models/events/football/football-events"
import { FootballGameLevelEvent, GameLevel } from "../src/models/events/football/football-game-level.event"

describe("AdapterService", function () {

  const scope = Scope.Game
  const datasource = Datasource.Sportradar
  const scopeId = randomUUID()

  const ctx: {
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

    ctx.redis = await initStandaloneRedis()

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
        ctx.notifications.push({ route, message, options })
        return {} as T
      },
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

  describe('single condition', function () {

    before(async () => {
      await ctx.redis.flushall()

      const triggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        scopeId,
      } as EssentialTriggerData

      const triggerConditions = [
        {
          event: FootballEvents.GamePointsHome,
          type: ConditionType.SetAndCompare,
          compare: CompareOp.GreaterOrEqual,
          target: 30,
        },
      ] as Partial<TriggerCondition>[]

      const triggerId = await ctx.studioService.createTrigger(triggerData, triggerConditions)

      const subscriptionData = {
        route: "some.route",
        payload: { foo: "bar" }
      } as CreateSubscriptionData

      await ctx.studioService.subscribeTrigger(triggerId, subscriptionData)
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

      const keys = await ctx.redis.keys("*")
      assert.equal(keys.length, 0)
    })
  })

  describe('multiple conditions', function () {
    let triggerId

    before(async () => {
      ctx.notifications = []
      await ctx.redis.flushall()

      const triggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        scopeId,
      } as EssentialTriggerData

      const triggerConditions = [
        {
          event: FootballEvents.GamePointsHome,
          type: ConditionType.SetAndCompare,
          compare: CompareOp.GreaterOrEqual,
          target: 30,
        },
        {
          event: FootballEvents.GameLevel,
          type: ConditionType.SetAndCompareAsString,
          compare: CompareOp.Equal,
          target: GameLevel.End,
        },
      ] as Partial<TriggerCondition>[]

      triggerId = await ctx.studioService.createTrigger(triggerData, triggerConditions)

      const subscriptionData = {
        route: "some.route2",
        payload: { foo: "bar" }
      } as CreateSubscriptionData

      await ctx.studioService.subscribeTrigger(triggerId, subscriptionData)
    })

    it(`event for first, first - not activated, second - not activated`, async () => {

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
      const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(triggerId)
      assert.equal(condition1.activated, false)
      assert.equal(condition2.activated, false)
    })

    it(`event for first, first - activated, second - not`, async () => {

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
      const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(triggerId)
      assert.equal(condition1.activated, true)
      assert.equal(condition2.activated, false)
    })

    it(`event for second, first - activated, second - not`, async () => {

      const event = {
        name: FootballEvents.GameLevel,
        value: GameLevel.Start,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
      } as FootballGameLevelEvent

      await ctx.adapterService.pushEvent(event)
      const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(triggerId)
      assert.equal(condition1.activated, true)
      assert.equal(condition2.activated, false)
    })

    it(`event for second, second - activated, first - activated, trigger - activated`, async () => {

      const event = {
        name: FootballEvents.GameLevel,
        value: GameLevel.End,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
      } as FootballGameLevelEvent

      await ctx.adapterService.pushEvent(event)

      const conditions = await ctx.conditions.getByTriggerId(triggerId)
      assert.equal(conditions.length, 0)

      const [ notification ] = ctx.notifications
      assert.equal(ctx.notifications.length, 1)
      assert.equal(notification.route, "some.route2")
    })
  })


})
