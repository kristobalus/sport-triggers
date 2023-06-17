
import { randomUUID } from "crypto"
import assert from "assert"

import IORedis, { Redis } from "ioredis"

import { TriggerConditionCollection } from "../../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../../src/repositories/trigger.collection"
import { Trigger } from "../../src/models/entities/trigger"

describe("ConditionCollection", function () {
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
  })

  it('should create trigger', async () => {
    ctx.id = await ctx.triggers.add({
      name: "home points 30+",
      description: "should trigger when home points reach 30 or more",
      datasource: "sportradar",
      scope: "game",
      scopeId: "d8539eb6-3e27-40c8-906f-9cd1736321d8"
    } as Partial<Trigger>)
    ctx.trigger = await ctx.triggers.getOneById(ctx.id)
    assert.ok(ctx.id)
    assert.ok(ctx.trigger)
  })

  it('should add conditions', async () => {
    await ctx.conditions.add(ctx.id, [
      {
        id: randomUUID(),
        event: "game.home_points",
        type: "set-and-compare",
        compare: "ge",
        target: 30
      }
    ])
  })

  it('should get conditions', async () => {
    const items = await ctx.conditions.get(ctx.id)

    console.log(items)
  })
})
