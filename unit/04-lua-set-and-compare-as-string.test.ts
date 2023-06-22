// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { randomUUID } from "crypto"
import assert from "assert"
import { Redis } from "ioredis"

import { conditionKey, TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Datasource, Scope, Trigger } from "../src/models/entities/trigger"
import { CompareOp, ConditionType } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/models/events/football/football-events"
import { GameLevel } from "../src/models/events/football/football-game-level.event"
import { initStandaloneRedis } from "./helper/init-standalone-redis"

describe("set_and_compare_as_string.lua", function () {

  const datasource = Datasource.Sportradar
  const scope = Scope.Game
  const scopeId = randomUUID()

  const ctx: {
    redis?: Redis
    id?: string
    trigger?: Trigger
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection,
    key?: string
  } = {}

  before(async () => {

    ctx.redis = await initStandaloneRedis()
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)

    ctx.id = await ctx.triggers.add({
      name: "...",
      description: "...",
      datasource,
      scope,
      scopeId,
    } as Partial<Trigger>)
    ctx.trigger = await ctx.triggers.getOne(ctx.id)

    await ctx.conditions.add(ctx.id, scope, scopeId, [
      {
        id: randomUUID(),
        event: FootballEvents.GameLevel,
        type: ConditionType.SetAndCompareAsString,
        compare: CompareOp.Equal,
        target: GameLevel.QuarterStart,
      },
    ])

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    ctx.key = conditionKey(condition.id)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`should not activate condition when compare failed`, async () => {
    const [ result, append ] = await ctx.redis.set_and_compare_as_string(ctx.key, GameLevel.Start)
    assert.equal(result, 0)
    assert.equal(append, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, false)
  })

  it(`should activated condition when compare successful`, async () => {
    const [ result, append ] = await ctx.redis.set_and_compare_as_string(ctx.key, GameLevel.QuarterStart)
    assert.equal(result, 1)
    assert.equal(append, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, true)
  })

  it(`once activated condition is not changed by further events`, async () => {
    const [ result, append ] = await ctx.redis.set_and_compare_as_string(ctx.key, GameLevel.QuarterEnd)
    assert.equal(result, 1)
    assert.equal(append, 0)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, true)
  })

})
