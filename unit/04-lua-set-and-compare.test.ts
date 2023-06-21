// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from "ioredis"
import { conditionKey, TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Datasource, Scope, Trigger } from "../src/models/entities/trigger"
import { randomUUID } from "crypto"
import { CompareOp, ConditionTypes } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/models/events/football/football-events"
import assert from "assert"
import { initRedis } from "./helper/init-redis"

describe("set_and_compare.lua", function () {

  const datasource = Datasource.Sportradar
  const scope = Scope.Game
  const scopeId = randomUUID()
  const event = FootballEvents.GamePointsHome

  const ctx: {
    redis?: Redis
    id?: string
    trigger?: Trigger
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection,
    key?: string
  } = {}

  before(async () => {

    ctx.redis = await initRedis()
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)

    ctx.id = await ctx.triggers.add({
      name: "...",
      description: "...",
      datasource,
      scope,
      scopeId,
    } as Partial<Trigger>)
    ctx.trigger = await ctx.triggers.getOneById(ctx.id)

    await ctx.conditions.add(ctx.id, scope, scopeId, [
      {
        id: randomUUID(),
        event,
        type: ConditionTypes.SetAndCompare,
        compare: CompareOp.GreaterOrEqual,
        target: 30,
      },
    ])

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    ctx.key = conditionKey(condition.id)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`should not activate condition when compare failure`, async () => {
    const result = await ctx.redis.set_and_compare(ctx.key, 10)
    assert.equal(result, 0)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, false)
  })

  it.skip(`should activated condition by compare success`, async () => {
    const result = await ctx.redis.set_and_compare(ctx.key, 40)
    assert.equal(result, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, true)
  })

  it.skip(`once activated condition is not changed by further events`, async () => {
    const result = await ctx.redis.set_and_compare(ctx.key, 10)
    assert.equal(result, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, true)
  })
})
