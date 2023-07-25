// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from "ioredis"
import pino from "pino"
import assert from "assert"
import pretty from "pino-pretty"

import { Event } from "../src/models/events/event"
import { Scope, Trigger } from "../src/models/entities/trigger"
import { AdapterService } from "../src/services/adapter/adapter.service"
import { AMQPTransport, Publish } from "@microfleet/transport-amqp"
import { randomUUID } from "crypto"
import { StudioService } from "../src/services/studio/studio.service"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"
import { initStandaloneRedis } from "./helper/init-standalone-redis"
import { FootballEvents } from "../src/configs/studio/football/football-events"
import { GameLevel } from "../src/configs/studio/football/game-level"
import { EssentialSubscriptionData } from "../src/models/dto/trigger-subscribe-request"
import { BasketballEvents } from "../src/configs/studio/basketball/basketball-events"

describe("AdapterService", function () {

  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "moderation"
  const entityId = randomUUID()
  const homeId = randomUUID()
  const awayId = randomUUID()

  const ctx: {
    redis?: Redis,
    adapterService?: AdapterService,
    studioService?: StudioService,
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection
    subscriptions?: TriggerSubscriptionCollection
    notifications: any[],
    trigger?: Trigger
  } = {
    notifications: [],
  }

  before(async () => {

    ctx.redis = await initStandaloneRedis()

    const log = pino({
      name: "AdapterService",
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
          event: BasketballEvents.TeamShootingFoul,
          compare: CompareOp.In,
          targets: [ homeId ],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: [ 2 ],
            },
          ],
        },
      ]

      const triggerId = await ctx.studioService.createTrigger(triggerData, conditionData)
      const result = await ctx.studioService.getTrigger(triggerId)
      ctx.trigger = result.trigger

      const subscriptionData = {
        route: "some.route",
        payload: { id: 1 }
      } as EssentialSubscriptionData

      await ctx.studioService.subscribeTrigger(triggerId, subscriptionData)
    })

    it(`adapter pushes event with value under threshold, trigger should not be activated`, async () => {

      const event: Event = {
        name: BasketballEvents.TeamShootingFoul,
        value: homeId,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Sequence]: 1
        }
      }

      await ctx.adapterService.evaluateTrigger(event, ctx.trigger.id)
      assert.equal(ctx.notifications.length, 0)
    })

    it(`adapter pushes event with value above threshold, trigger should be activated`, async () => {

      const event: Event = {
        name: BasketballEvents.TeamShootingFoul,
        value: homeId,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Sequence]: 2
        }
      }

      const result = await ctx.adapterService.evaluateTrigger(event, ctx.trigger.id)
      assert.equal(result, true)
    })
  })

  describe('multiple conditions', function () {

    before(async () => {
      ctx.notifications = []
      await ctx.redis.flushall()

      const triggerData: EssentialTriggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        scopeId,
        entity,
        entityId
      }

      const triggerConditions: EssentialConditionData[] = [
        {
          event: BasketballEvents.TeamShootingFoul,
          compare: CompareOp.In,
          targets: [ homeId ],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: [ 1 ],
            },
          ],
        },
        {
          event: BasketballEvents.TeamShootingFoul,
          compare: CompareOp.In,
          targets: [ homeId ],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: [ 2 ],
            },
          ],
        }
      ]

      const triggerId = await ctx.studioService.createTrigger(triggerData, triggerConditions)
      const result = await ctx.studioService.getTrigger(triggerId)
      ctx.trigger = result.trigger

      // const subscriptionData = {
      //   route: "some.route2",
      //   payload: { foo: "bar" }
      // } as EssentialSubscriptionData
      //
      // await ctx.studioService.subscribeTrigger(triggerId, subscriptionData)
    })

    it(`event for first, first - not activated, second - not activated`, async () => {

      const event: Event = {
        name: BasketballEvents.TeamShootingFoul,
        value: awayId,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Sequence]: 1,
          [BasketballEvents.TeamShootingFoul]: awayId
        }
      }

      await ctx.adapterService.evaluateTrigger(event, ctx.trigger.id)
      const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(ctx.trigger.id)
      assert.equal(condition1.activated, false)
      assert.equal(condition2.activated, false)
    })

    it(`event for first, first - activated, second - not`, async () => {

      const event: Event = {
        name: BasketballEvents.TeamShootingFoul,
        value: homeId,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Sequence]: 1,
          [BasketballEvents.TeamShootingFoul]: homeId
        }
      }

      await ctx.adapterService.evaluateTrigger(event, ctx.trigger.id)
      const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(ctx.trigger.id)
      assert.equal(condition1.activated, true)
      assert.equal(condition2.activated, false)
    })

    it(`event for second, first - activated, second - not`, async () => {

      const event: Event = {
        name: BasketballEvents.TeamShootingFoul,
        value: awayId,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Sequence]: 2,
          [BasketballEvents.TeamShootingFoul]: awayId
        }
      }

      await ctx.adapterService.evaluateTrigger(event, ctx.trigger.id)
      const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(ctx.trigger.id)
      console.log(condition1, condition2)
      assert.equal(condition1.activated, true)
      assert.equal(condition2.activated, false)
    })

    it(`event for second, second - activated, first - activated, trigger - activated`, async () => {

      const event: Event = {
        name: BasketballEvents.TeamShootingFoul,
        value: homeId,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Sequence]: 2,
          [BasketballEvents.TeamShootingFoul]: homeId
        }
      }

      const result = await ctx.adapterService.evaluateTrigger(event, ctx.trigger.id)
      assert.equal(result, true)

      const [ condition1, condition2 ] = await ctx.conditions.getByTriggerId(ctx.trigger.id)
      assert.equal(condition1.activated, true)
      assert.equal(condition2.activated, true)
    })
  })

  describe('methods', function () {

    before(async () => {
      ctx.notifications = []
      await ctx.redis.flushall()

      const triggerData: EssentialTriggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        scopeId,
        entity,
        entityId
      }

      const triggerConditions: EssentialConditionData[] = [
        {
          event: BasketballEvents.TeamShootingFoul,
          compare: CompareOp.In,
          targets: [ homeId ],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: [ 1 ],
            },
          ],
        },
        {
          event: BasketballEvents.TeamShootingFoul,
          compare: CompareOp.In,
          targets: [ homeId ],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: [ 2 ],
            },
          ],
        }
      ]

      await ctx.studioService.createTrigger(triggerData, triggerConditions)
      console.log(triggerData)
      await ctx.studioService.createTrigger(triggerData, triggerConditions)
      const triggers = await ctx.studioService.getTriggerListByScope(datasource, scope, scopeId, { showLog: true, trim: true })
      console.log(triggers)
    })

    it(`getTriggers`, async () => {

      const event: Event = {
        name: FootballEvents.GameLevel,
        value: GameLevel.End,
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        timestamp: Date.now(),
        options: {
          [FootballEvents.GameLevel]: GameLevel.End
        }
      }

      for await (const triggers of ctx.adapterService.getTriggers(event)){
          console.log(triggers)
      }

    })
  })


})
