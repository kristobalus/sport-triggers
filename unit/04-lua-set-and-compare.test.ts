// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from "ioredis"
import assert from "assert"
import { randomUUID } from "crypto"

import {
  conditionKey,
  conditionLogKey,
  TriggerConditionCollection,
} from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Scope, Trigger } from "../src/models/entities/trigger"
import { Event } from "../src/models/events/event"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/studio/football/football-events"
import { initStandaloneRedis } from "./helper/init-standalone-redis"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"

describe("set_and_compare.lua", function () {

  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "moderation"
  const entityId = randomUUID()
  const passingPlayerId = randomUUID()
  const rushingPlayerId = randomUUID()

  const ctx: {
    redis?: Redis
    triggerId?: string
    trigger?: Trigger
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection,
    conditionKey?: string
    conditionLogKey?: string
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
      entityId,
    }
    ctx.triggerId = await ctx.triggers.add(triggerData)
    ctx.trigger = await ctx.triggers.getOne(ctx.triggerId)

    const conditionData: EssentialConditionData[] = [
      {
        event: FootballEvents.PlayerRushing,
        compare: CompareOp.Equal,
        targets: [ rushingPlayerId ],
        options: [
          {
            event: FootballEvents.PlayerPassing,
            compare: CompareOp.Equal,
            targets: [ passingPlayerId ],
          },
        ],
      },
    ]

    await ctx.conditions.add(ctx.triggerId, datasource, scope, scopeId, conditionData)

    const [ condition ] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    ctx.conditionKey = conditionKey(condition.id)
    ctx.conditionLogKey = conditionLogKey(condition.id)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`should not activate condition when compare main current failed`, async () => {

    const event: Event = {
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      timestamp: Date.now(),
      name: FootballEvents.PlayerRushing,
      value: passingPlayerId,
      options: {
        [FootballEvents.PlayerPassing]: passingPlayerId
      },
    }

    const [result] = await ctx.redis.set_and_compare(2,
      ctx.conditionKey,
      ctx.conditionLogKey,
      JSON.stringify(event))

    assert.equal(result, 0)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, false)
  })

  it(`should not activate condition when compare options failed`, async () => {
    const event: Event = {
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      timestamp: Date.now(),
      name: FootballEvents.PlayerRushing,
      value: rushingPlayerId,
      options: {
        [FootballEvents.PlayerPassing]: rushingPlayerId
      },
    }

    const [result] = await ctx.redis.set_and_compare(2,
      ctx.conditionKey,
      ctx.conditionLogKey,
      JSON.stringify(event))
    assert.equal(result, 0)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, false)
  })

  it(`should activated condition when compare successful`, async () => {

    const event: Event = {
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      timestamp: Date.now(),
      name: FootballEvents.PlayerRushing,
      value: rushingPlayerId,
      options: {
        [FootballEvents.PlayerPassing]: passingPlayerId
      },
    }

    const [result, debug] = await ctx.redis.set_and_compare(2,
      ctx.conditionKey, // conditionKey
      ctx.conditionLogKey,
      JSON.stringify(event)
    )
    console.log(debug)
    assert.equal(result, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, true)
  })

  it(`once being activated condition should not be changed by further events`, async () => {

    const event: Event = {
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      timestamp: Date.now(),
      name: FootballEvents.PlayerRushing,
      value: rushingPlayerId,
      options: {
        [FootballEvents.PlayerPassing]: passingPlayerId
      },
    }

    const [result] = await ctx.redis.set_and_compare(2,
      ctx.conditionKey,
      ctx.conditionLogKey,
      JSON.stringify(event))

    assert.equal(result, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, true)
  })

})
