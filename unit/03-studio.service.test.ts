// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import assert from "assert"
import IORedis, { Redis } from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

import { StudioService } from "../src/services/studio.service"
import { CreateTriggerData } from "../src/models/dto/trigger-create-request"
import { ConditionTypes, CompareOp, TriggerCondition } from "../src/models/entities/trigger-condition"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { randomUUID } from "crypto"
import { FootballEvents } from "../src/models/events/football/football-events"
import { GameLevel } from "../src/models/events/football/football-game-level.event"
import { Datasource } from "../src/models/entities/trigger"
import { CreateSubscriptionData } from "../src/models/entities/trigger-subscription"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"

describe("StudioService", function () {

  const datasource = Datasource.Sportradar
  const scope = "game"
  const scopeId = randomUUID()

  const ctx: {
    redis?: Redis,
    triggerId?: string
    service?: StudioService
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection,
    subscriptions?: TriggerSubscriptionCollection
  } = {}

  before(async () => {
    ctx.redis = new IORedis()
    await ctx.redis.flushall()

    const log = pino({
      name: "StudioService",
      level: "info"
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    }))

    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptions = new TriggerSubscriptionCollection(ctx.redis)
    ctx.service = new StudioService(log, ctx.redis)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`should create trigger`, async () => {

    const triggerData = {
      name: "...",
      description: "..",
      datasource,
      scope,
      scopeId
    } as CreateTriggerData

    const conditions = [
      {
        event: FootballEvents.GameLevel,
        type: ConditionTypes.SetAndCompareAsString,
        compare: CompareOp.Equal,
        target: GameLevel.Start
      }
    ] as Partial<TriggerCondition>[]

    ctx.triggerId = await ctx.service.createTrigger(triggerData, conditions)
    assert.ok(ctx.triggerId)

    const [ condition ] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.event, FootballEvents.GameLevel)
    assert.equal(condition.type, ConditionTypes.SetAndCompareAsString)
    assert.equal(condition.compare, CompareOp.Equal)
    assert.equal(condition.target, GameLevel.Start)
  })

  it(`should find list of triggers by scope`, async () => {
    const triggers = await ctx.triggers.findByScope(scope, scopeId)
    assert.equal(triggers.length, 1)
    assert.equal(triggers.indexOf(ctx.triggerId), 0)
  })

  it(`should be able to find trigger by event and scope`, async () => {
    const triggers = await ctx.conditions.findTriggersByScopeAndEvent(scope, scopeId, FootballEvents.GameLevel)
    assert.equal(triggers.length, 1)
    assert.equal(triggers.indexOf(ctx.triggerId), 0)
  })

  it(`studio should create subscription for trigger`, async () => {

    const params = {
      route: "some.route",
      payload: { foo: "bar" }
    } as CreateSubscriptionData

    const id = await ctx.service.subscribeTrigger(ctx.triggerId, params)

    const subscription = await ctx.subscriptions.getOne(id)

    assert.ok(subscription)
    assert.ok(subscription.route)
    assert.ok(subscription.payload)
    assert.equal(subscription.route, params.route)
  })


})
