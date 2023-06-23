// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { randomUUID } from "crypto"
import assert from "assert"

import IORedis, { Redis } from "ioredis"

import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Scope, Trigger } from "../src/models/entities/trigger"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/models/events/football/football-events"
import { EssentialConditionData } from "../src/models/dto/trigger-create-request"
import { FootballPlayerStates } from "../src/models/events/football/football-player-state.event"

describe("ConditionCollection", function () {

  const scope = Scope.SportradarGames
  const scopeId = randomUUID()
  const entity = "moderation"
  const entityId = randomUUID()

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
    await ctx.redis.flushall()
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it('should create trigger', async () => {
    ctx.id = await ctx.triggers.add({
      name: "...",
      description: "...",
      scope,
      scopeId,
      entity,
      entityId
    } as Partial<Trigger>)

    ctx.trigger = await ctx.triggers.getOne(ctx.id)

    assert.ok(ctx.id)
    assert.ok(ctx.trigger)
  })

  it(`should add condition for ${FootballEvents.GamePointsHome}`, async () => {
    await ctx.conditions.add(ctx.id, scope, scopeId, [
      {
        event: FootballEvents.GamePointsHome,
        compare: CompareOp.GreaterOrEqual,
        target: "30"
      }
    ] as EssentialConditionData[])
  })

  it(`should add condition for ${FootballEvents.PlayerState}`, async () => {
    await ctx.conditions.add(ctx.id, scope, scopeId, [
      {
        event: FootballEvents.PlayerState,
        compare: CompareOp.Equal,
        target: FootballPlayerStates.Touchdown,
        params: {
          player: randomUUID()
        }
      }
    ] as EssentialConditionData[])
  })

  it(`should fail to add condition for ${FootballEvents.PlayerState} with wrong target`, async () => {
    await assert.rejects(ctx.conditions.add(ctx.id, scope, scopeId, [
      {
        event: FootballEvents.PlayerState,
        compare: CompareOp.Equal,
        target: "wrong",
        params: {
          player: randomUUID()
        }
      }
    ] as EssentialConditionData[]), (_err) => {
      console.log(_err)
      return true
    })
  })

  it(`should get triggers by event ${FootballEvents.GamePointsHome} and scope`, async () => {
    const items = await ctx.conditions.findTriggersByScopeAndEvent(scope, scopeId, FootballEvents.GamePointsHome)
    assert.ok(items.length)
  })

  it('should get conditions by trigger id', async () => {
    const items = await ctx.conditions.getByTriggerId(ctx.id)
    assert.ok(items.length)
  })


})
