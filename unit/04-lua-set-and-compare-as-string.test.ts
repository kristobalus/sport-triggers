// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import path from "path"
import { randomUUID } from "crypto"
import * as fs from "fs"
import assert from "assert"
import IORedis, { Redis, RedisOptions } from "ioredis"

import { conditionKey, TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Datasource, Scope, Trigger } from "../src/models/entities/trigger"
import { CompareOp, ConditionTypes } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/models/events/football/football-events"
import { GameLevel } from "../src/models/events/football/football-game-level.event"

describe("Lua scripts", function () {

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

    ctx.redis = new IORedis({ keyPrefix: "{triggers}" } as RedisOptions)
    ctx.redis.defineCommand("set_and_compare_as_string", {
      numberOfKeys: 1,
      lua: fs.readFileSync(path.resolve(__dirname, '../lua/set_and_compare_as_string.lua')).toString("utf-8"),
    })
    await ctx.redis.flushall()

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
        event: FootballEvents.GameLevel,
        type: ConditionTypes.SetAndCompareAsString,
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

  it(`should return false when condition is not activated and target != current`, async () => {
    const result = await ctx.redis.set_and_compare_as_string(ctx.key, GameLevel.Start)
    assert.equal(result, false)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, false)
  })

  it(`should return true when condition activated by target == current`, async () => {
    const result = await ctx.redis.set_and_compare_as_string(ctx.key, GameLevel.QuarterStart)
    assert.equal(result, true)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, true)
  })

  it(`once activated condition is not changed by further events`, async () => {
    const result = await ctx.redis.set_and_compare_as_string(ctx.key, GameLevel.QuarterEnd)
    assert.equal(result, true)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.id)
    assert.equal(condition.activated, true)
  })

})
