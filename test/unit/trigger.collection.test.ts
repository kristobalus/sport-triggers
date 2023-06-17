import * as assert from "assert"
import { randomUUID } from "crypto"

import IORedis, { Redis } from "ioredis"

import { TriggerCollection } from "../../src/repositories/trigger.collection"
import { Trigger } from "../../src/models/entities/trigger"

describe("TriggerCollection", function () {

  const ctx: {
    scope: string,
    scopeId: string,
    redis?: Redis
    triggers?: TriggerCollection
    id?: string
  } = {
    scope: "game",
    scopeId: "d8539eb6-3e27-40c8-906f-9cd1736321d8",
  }

  before(async () => {
    ctx.redis = new IORedis()
    ctx.triggers = new TriggerCollection(ctx.redis)
    await ctx.redis.flushall()
  })

  it('should add trigger', async () => {
    ctx.id = await ctx.triggers.add({
      name: "home points 30+",
      description: "should trigger when home points reach 30 or more",
      datasource: "sportradar",
      scope: ctx.scope,
      scopeId: ctx.scopeId
    } as Partial<Trigger>)
    assert.ok(ctx.id)
  })

  it('should get trigger', async () => {
    const trigger = await ctx.triggers.getOneById(ctx.id)

    assert.ok(trigger)
    assert.ok(trigger.id == ctx.id)
  })

  it('should find trigger set for scope', async () => {
    const items = await ctx.triggers.getByScope(ctx.scope, ctx.scopeId)
    assert.ok(items.length)
  })

  it('should update trigger', async () => {
    const name = randomUUID()

    await ctx.triggers.update(ctx.id, { name } as Partial<Trigger>)
    const trigger = await ctx.triggers.getOneById(ctx.id)

    assert.ok(trigger.name === name)
  })

  it('should delete trigger', async () => {
    const result = await ctx.triggers.delete(ctx.id)

    assert.ok(result)
    const item = await ctx.triggers.getOneById(ctx.id)

    assert.equal(item, null)
  })
})
