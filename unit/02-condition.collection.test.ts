// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { randomUUID } from "crypto"
import assert from "assert"

import IORedis, { Redis } from "ioredis"

import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Scope, Trigger } from "../src/models/entities/trigger"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { FootballEvents } from "../src/models/events/football/football-events"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { FootballPlayerStates } from "../src/models/events/football/football-player-state.event"

describe("ConditionCollection", function () {

  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "moderation"
  const entityId = randomUUID()

  const ctx: {
    triggerId?: string
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
    const essentialData: EssentialTriggerData = {
      name: "...",
      description: "...",
      datasource,
      scope,
      scopeId,
      entity,
      entityId,
    }

    ctx.triggerId = await ctx.triggers.add(essentialData)
    ctx.trigger = await ctx.triggers.getOne(ctx.triggerId)

    assert.ok(ctx.triggerId)
    assert.ok(ctx.trigger)
  })

  it(`should add condition for ${FootballEvents.GamePointsHome}`, async () => {
    const data: EssentialConditionData[] = [
      {
        event: FootballEvents.GamePointsHome,
        compare: CompareOp.GreaterOrEqual,
        target: "30",
        options: [],
      },
    ]
    await ctx.conditions.add(ctx.triggerId, datasource, scope, scopeId, data)
  })

  it(`should add condition for ${FootballEvents.PlayerState}`, async () => {
    const data: EssentialConditionData[] = [
      {
        event: FootballEvents.PlayerState,
        compare: CompareOp.Equal,
        target: FootballPlayerStates.Touchdown,
        options: [
          {
            event: FootballEvents.Player,
            compare: CompareOp.Equal,
            target: randomUUID(),
          },
        ],
      },
    ]
    await ctx.conditions.add(ctx.triggerId, datasource, scope, scopeId, data)
  })

  it(`should fail to add condition for ${FootballEvents.PlayerState} with wrong target`, async () => {
    const data: EssentialConditionData[] = [
      {
        event: FootballEvents.PlayerState,
        compare: CompareOp.Equal,
        target: "wrong",
        options: [
          {
            target: randomUUID(),
            compare: CompareOp.Equal,
            event: FootballEvents.Player,
          },
        ],
      },
    ]

    await assert.rejects(
      ctx.conditions.add(ctx.triggerId, datasource, scope, scopeId, data),
      (err: Error) => {
        assert(err)
        assert.equal(err.name.includes("ArgumentError"), true)
        assert.equal(err.message.includes("Condition for event"), true)
        assert.equal(err.message.includes("should have target one of"), true)
        return true
      })
  })

  it(`should get triggers by event ${FootballEvents.GamePointsHome} and scope`, async () => {
    const items = await ctx.conditions
      .getTriggerListByScopeAndEventName(scope, scopeId, FootballEvents.GamePointsHome)
    assert.ok(items.length)
  })

  it('should get conditions by trigger id', async () => {
    const items = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.ok(items.length > 0)
  })

})
