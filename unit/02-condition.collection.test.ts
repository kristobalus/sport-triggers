// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { randomUUID } from "crypto"
import assert from "assert"

import IORedis, { Redis } from "ioredis"

import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Datasource, Scope, Trigger } from "../src/models/entities/trigger"
import { ConditionTypes, CompareOp } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/models/events/football/football-events"

describe("ConditionCollection", function () {

  const scope = Scope.Game
  const scopeId = randomUUID()
  const datasource = Datasource.Sportradar
  const event = FootballEvents.GamePointsHome

  const ctx: {
    id?: string
    trigger?: Trigger
    redis?: Redis
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection
  } = {}

  before(async () => {
    ctx.redis = new IORedis()
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
    await ctx.redis.flushall()
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it('should create trigger', async () => {
    ctx.id = await ctx.triggers.add({
      name: "...",
      description: "...",
      datasource,
      scope,
      scopeId
    } as Partial<Trigger>)
    ctx.trigger = await ctx.triggers.getOneById(ctx.id)
    assert.ok(ctx.id)
    assert.ok(ctx.trigger)
  })

  it('should add conditions', async () => {
    await ctx.conditions.add(ctx.id, scope, scopeId, [
      {
        id: randomUUID(),
        event,
        type: ConditionTypes.SetAndCompare,
        compare: CompareOp.GreaterOrEqual,
        target: 30
      }
    ])
  })

  it('should get triggers by event and scope', async () => {
    const items = await ctx.conditions.findTriggersByScopeAndEvent(scope, scopeId, event)
    assert.ok(items.length)
  })

  it('should get conditions by trigger', async () => {
    const items = await ctx.conditions.getByTriggerId(ctx.id)
    assert.ok(items.length)
  })


})
