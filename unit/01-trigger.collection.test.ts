// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import * as assert from "assert"
import { randomUUID } from "crypto"

import { Redis } from "ioredis"

import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Scope, Trigger } from "../src/models/entities/trigger"
import { initStandaloneRedis } from "./helper/init-standalone-redis"
import { EssentialTriggerData } from "../src/models/dto/trigger-create-request"

describe("TriggerCollection", function () {

  const scope = Scope.Game
  const scopeId = randomUUID()
  const datasource = "sportradar"
  const entity = "moderation"
  const entityId = randomUUID()

  const ctx: {
    redis?: Redis
    triggers?: TriggerCollection
    triggerId?: string
  } = {}

  before(async () => {
    ctx.redis = await initStandaloneRedis()
    ctx.triggers = new TriggerCollection(ctx.redis)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it('should add trigger', async () => {
    const data: EssentialTriggerData = {
      name: "home points 30+",
      description: "should trigger when home points reach 30 or more",
      datasource,
      scope,
      scopeId,
      entity,
      entityId
    }
    ctx.triggerId = await ctx.triggers.add(data)
    assert.ok(ctx.triggerId)
  })

  it('should get trigger', async () => {
    const trigger = await ctx.triggers.getOne(ctx.triggerId)
    assert.ok(trigger)
    assert.ok(trigger.id == ctx.triggerId)
  })

  it('should be able to find trigger set by scope', async () => {
    const items = await ctx.triggers.getListByScope(datasource, scope, scopeId)
    assert.ok(items.length > 0)
    assert.equal(items[0], ctx.triggerId)
  })

  it('should be able to update trigger', async () => {
    const name = randomUUID()

    await ctx.triggers.updateOne(ctx.triggerId, { name } as Partial<Trigger>)
    const trigger = await ctx.triggers.getOne(ctx.triggerId)

    assert.ok(trigger.name === name)
  })

  it('should be able to disable trigger', async () => {
    await ctx.triggers.updateOne(ctx.triggerId, { disabled: true } as Partial<Trigger>)
    const trigger = await ctx.triggers.getOne(ctx.triggerId)

    assert.ok(trigger.disabled)
  })

  it('should be able to enable trigger', async () => {
    await ctx.triggers.updateOne(ctx.triggerId, { disabled: false } as Partial<Trigger>)
    const trigger = await ctx.triggers.getOne(ctx.triggerId)

    assert.ok(!trigger.disabled)
  })

  it('should be able to delete trigger', async () => {
    const result = await ctx.triggers.deleteOne(ctx.triggerId)

    assert.ok(result)
    const item = await ctx.triggers.getOne(ctx.triggerId)

    assert.equal(item, null)
  })
})
