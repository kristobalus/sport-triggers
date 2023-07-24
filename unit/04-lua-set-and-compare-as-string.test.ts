// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { randomUUID } from "crypto"
import assert from "assert"
import { Redis } from "ioredis"

import { conditionKey, TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Scope, Trigger } from "../src/models/entities/trigger"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/configs/definitions/football/football-events"
import { GameLevel } from "../src/configs/definitions/football/football-game-level"
import { initStandaloneRedis } from "./helper/init-standalone-redis"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"

describe("set_and_compare_as_string.lua", function () {

  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "moderation"
  const entityId = randomUUID()

  const ctx: {
    redis?: Redis
    triggerId?: string
    trigger?: Trigger
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection,
    key?: string
  } = {}

  before(async () => {

    ctx.redis = await initStandaloneRedis()
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)

    const triggerData: EssentialTriggerData = {
      name: "...",
      description: "...",
      datasource,
      scope,
      scopeId,
      entity,
      entityId
    }

    ctx.triggerId = await ctx.triggers.add(triggerData)
    ctx.trigger = await ctx.triggers.getOne(ctx.triggerId)

    const conditionData: EssentialConditionData[] = [
        {
          event: FootballEvents.GameLevel,
          compare: CompareOp.Equal,
          targets: GameLevel.QuarterStart,
          options: []
        },
    ]

    await ctx.conditions.add(ctx.triggerId, datasource, scope, scopeId, conditionData)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    ctx.key = conditionKey(condition.id)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`should not activate condition when compare failed`, async () => {
    const [ result, append, log ] = await ctx.redis.set_and_compare(1, ctx.key, GameLevel.Start)
    assert.equal(result, 0)
    assert.equal(append, 1)
    console.log(JSON.parse(log))

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, false)
  })

  it(`should activated condition when compare successful`, async () => {
    const [ result, append, log ] = await ctx.redis.set_and_compare(1, ctx.key, GameLevel.QuarterStart)
    assert.equal(result, 1)
    assert.equal(append, 1)
    console.log(JSON.parse(log))

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, true)
  })

  it(`once activated condition is not changed by further events`, async () => {
    const [ result, append, log ] = await ctx.redis.set_and_compare(1, ctx.key, GameLevel.QuarterEnd)
    assert.equal(result, 1)
    assert.equal(append, 0)
    console.log(JSON.parse(log))

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, true)
  })

})
