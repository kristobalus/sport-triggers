// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import assert from "assert"
import IORedis, { Redis } from "ioredis"
import pino from "pino"
import pretty from "pino-pretty"

import { StudioService } from "../src/services/studio/studio.service"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { ConditionType, CompareOp } from "../src/models/entities/trigger-condition"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { randomUUID } from "crypto"
import { FootballEvents } from "../src/models/events/football/football-events"
import { GameLevel } from "../src/models/events/football/football-game-level"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"
import { Scope } from "../src/models/entities/trigger"
import { EssentialSubscriptionData } from "../src/models/dto/trigger-subscribe-request"

describe("StudioService", function () {

  const scope = Scope.Game
  const scopeId = randomUUID()
  const datasource = "sportradar"
  const entity = "moderation"
  const entityId = randomUUID()

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

  it(`should get metadata`, async () => {
    const metadata = await ctx.service.getMetadata()
    assert.ok(metadata)
    assert.ok(metadata[FootballEvents.PlayerState])
  })

  it(`should create trigger`, async () => {

    const triggerData: EssentialTriggerData = {
      name: "...",
      description: "..",
      datasource,
      scope,
      scopeId,
      entity,
      entityId
    }

    const conditionData: EssentialConditionData[] = [
      {
        event: FootballEvents.GameLevel,
        compare: CompareOp.Equal,
        target: GameLevel.Start,
        options: []
      }
    ]

    ctx.triggerId = await ctx.service.createTrigger(triggerData, conditionData)
    assert.ok(ctx.triggerId)

    const [ condition ] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.event, FootballEvents.GameLevel)
    assert.equal(condition.type, ConditionType.String)
    assert.equal(condition.compare, CompareOp.Equal)
    assert.equal(condition.target, GameLevel.Start)
  })

  it(`should find list of triggers by scope`, async () => {
    const [ id ]  = await ctx.triggers.getListByScope(datasource, scope, scopeId)
    assert.ok(id)
    assert.equal(ctx.triggerId, id)
  })

  it(`should be able to find trigger by event and scope`, async () => {
    const triggers = await ctx.conditions
      .getTriggerListByScopeAndEventName(datasource, scope, scopeId, FootballEvents.GameLevel)
    assert.equal(triggers.length, 1)
    assert.equal(triggers.indexOf(ctx.triggerId), 0)
  })

  it(`studio should create subscription for trigger`, async () => {

    const data: EssentialSubscriptionData = {
      route: "some.route",
      payload: { foo: "bar" }
    }

    const id = await ctx.service.subscribeTrigger(ctx.triggerId, data)

    const subscription = await ctx.subscriptions.getOne(id)

    assert.ok(subscription)
    assert.ok(subscription.route)
    assert.ok(subscription.payload)
    assert.equal(subscription.route, data.route)
  })


})
