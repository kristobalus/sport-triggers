// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { randomUUID } from "crypto"
import assert from "assert"

import IORedis, { Redis } from "ioredis"

import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Trigger } from "../src/models/entities/trigger"

describe("ConditionCollection", function () {

  const scope = "game"
  const scopeId = randomUUID()
  const eventName = "football.game.points.home"
  const conditionType = "set-and-compare"

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
        event: eventName,
        type: conditionType,
        compare: "ge",
        target: 30
      }
    ])
  })

  it('should get triggers by event and scope', async () => {
    const items = await ctx.conditions.findTriggersByScopeAndEvent(scope, scopeId, eventName)
    assert.ok(items.length)
  })

  it('should get conditions by trigger', async () => {
    const items = await ctx.conditions.getByTrigger(ctx.id)
    assert.ok(items.length)
  })


})
