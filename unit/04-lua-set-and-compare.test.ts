// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from "ioredis"
import { conditionKey, TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Scope, Trigger } from "../src/models/entities/trigger"
import { randomUUID } from "crypto"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/models/events/football/football-events"
import assert from "assert"
import { initStandaloneRedis } from "./helper/init-standalone-redis"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"

describe("set_and_compare.lua", function () {

  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "moderation"
  const entityId = randomUUID()
  const playerId = randomUUID()

  const ctx: {
    redis?: Redis
    triggerId?: string
    trigger?: Trigger
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection,
    conditionKey?: string
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
        event: FootballEvents.PlayerRushing,
        compare: CompareOp.Equal,
        target: "30",
        options: [
          {
            event: FootballEvents.Player,
            compare: CompareOp.Equal,
            target: playerId
          }
        ]
      }
    ]

    await ctx.conditions.add(ctx.triggerId, datasource, scope, scopeId, conditionData)

    const [ condition ] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    ctx.conditionKey = conditionKey(condition.id)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`should not activate condition when compare main current failed`, async () => {
    const options = [
      FootballEvents.Player, playerId
    ]
    const [ result, append  ] = await ctx.redis.set_and_compare(1, ctx.conditionKey, "20", ...options)
    assert.equal(result, 0)
    assert.equal(append, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, false)
  })

  it(`should not activate condition when compare options failed`, async () => {
    const options = [
      FootballEvents.Player, randomUUID()
    ]
    const [ result, append  ] = await ctx.redis.set_and_compare(1, ctx.conditionKey, "30", ...options)
    assert.equal(result, 0)
    assert.equal(append, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, false)
  })

  it(`should activated condition when compare successful`, async () => {
    const options = [ FootballEvents.Player, playerId ]
    const [ result, append ] = await ctx.redis.set_and_compare(1,
      ctx.conditionKey, // conditionKey
      "30", // current argument for primary event
      ...options // options as eventName => eventValue
    )
    assert.equal(result, 1)
    assert.equal(append, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, true)
  })

  it(`once activated condition is not changed by further events`, async () => {
    const options = [ FootballEvents.Player, playerId ]
    const [ result, append ] = await ctx.redis.set_and_compare(1, ctx.conditionKey, "10", ...options)
    assert.equal(result, 1)
    assert.equal(append, 0)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, true)
  })
})
