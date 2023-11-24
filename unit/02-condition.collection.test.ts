// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { randomUUID } from "crypto"
import assert from "assert"

import IORedis, { Redis } from "ioredis"

import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Scope, Trigger } from "../src/models/entities/trigger"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { BasketballEvents } from "../src/sports/basketball/basketball-events"
import pino, { Logger } from "pino"
import { Sport } from "../src/models/events/sport"

describe("ConditionCollection", function () {

  const sport = Sport.Basketball
  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "question"
  const entityId = randomUUID()

  const ctx: {
    log?: Logger
    triggerId?: string
    trigger?: Trigger
    redis?: Redis
    triggers?: TriggerCollection
    triggerConditionCollection?: TriggerConditionCollection
    playerId?: string
    teamId?: string
  } = {}

  before(async () => {
    ctx.log = pino({ name: "test", level: "debug", transport: { target: "pino-pretty" } })
    ctx.redis = new IORedis()
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.triggerConditionCollection = new TriggerConditionCollection(ctx.redis)
    ctx.playerId = randomUUID()
    ctx.teamId = randomUUID()
  })

  after(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ctx.redis.disconnect()
  })

  describe(`api v1`, function() {

    before(async () => {
      await ctx.redis.flushall()
    })

    it('should create trigger', async () => {
      const essentialData: EssentialTriggerData = {
        name: "...name of trigger...",
        description: "...description of trigger...",
        datasource,
        sport,
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

    it(`should add condition`, async () => {
      const data: EssentialConditionData[] = [
        {
          event: BasketballEvents.Player,
          compare: CompareOp.In,
          targets: [ ctx.playerId ],
          options: [
            {
              event: BasketballEvents.PlayerScores3FG,
              compare: CompareOp.Equal,
              targets: [ "2" ]
            }
          ],
        },
      ]

      await ctx.triggerConditionCollection.add(ctx.triggerId, datasource, sport, scope, scopeId, data)

      const conditions = await ctx.triggerConditionCollection.getByTriggerId(ctx.triggerId)

      assert.ok(Array.isArray(conditions))
      ctx.log.debug({ conditions }, "conditions retrieved")

      for(const condition of conditions) {
        // assert.ok(Array.isArray(condition.targets))
        assert.ok(Array.isArray(condition.options))
      }
    })

    it(`should fail to add condition for ${BasketballEvents.Team} with wrong compare`, async () => {
      const data: EssentialConditionData[] = [
        {
          event: BasketballEvents.Team,
          compare: CompareOp.Equal,
          targets: [ "wrong" ],
          options: [
            {
              event: BasketballEvents.TeamScores3FG,
              compare: CompareOp.Equal,
              targets: [
                "2"
              ]
            },
          ],
        },
      ]

      await assert.rejects(
        ctx.triggerConditionCollection.add(ctx.triggerId, datasource, sport, scope, scopeId, data),
        (err: Error) => {
          ctx.log.debug({ err }, "adding condition raised error")
          assert(err)
          assert.equal(err.name.includes("ArgumentError"), true)
          assert.equal(err.message.includes("should have compare one of"), true)
          return true
        })
    })

    it(`should get triggers by event ${BasketballEvents.Player} and scope`, async () => {
      const items = await ctx.triggerConditionCollection
        .getTriggerListByScopeAndEventName(datasource, scope, scopeId, BasketballEvents.Player)
      assert.ok(items.length)
      ctx.log.debug({ items }, `list of triggers`)
    })

    it('should get conditions by trigger id', async () => {
      const conditions = await ctx.triggerConditionCollection.getByTriggerId(ctx.triggerId)
      assert.ok(conditions.length > 0)
      ctx.log.debug({ conditions }, `conditions`)
    })
  })

  describe(`api v2`, function() {

    before(async () => {
      await ctx.redis.flushall()
    })

    it('should create trigger', async () => {
      const essentialData: EssentialTriggerData = {
        name: "...name of trigger...",
        description: "...description of trigger...",
        datasource,
        sport,
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

    it(`should add condition`, async () => {

      const data: EssentialConditionData[] = [
        {
          options: [
            {
              event: BasketballEvents.Player,
              compare: CompareOp.In,
              targets: [ ctx.playerId ],
            },
            {
              event: BasketballEvents.PlayerScores3FG,
              compare: CompareOp.Equal,
              targets: [ "2" ]
            }
          ],
        },
      ]

      await ctx.triggerConditionCollection.add(ctx.triggerId, datasource, sport, scope, scopeId, data)

      const conditions = await ctx.triggerConditionCollection.getByTriggerId(ctx.triggerId)

      assert.ok(Array.isArray(conditions))
      ctx.log.debug({ conditions }, "conditions retrieved")

      for(const condition of conditions) {
        // assert.ok(Array.isArray(condition.targets))
        assert.ok(Array.isArray(condition.options))
      }
    })

    it(`should fail to add condition for ${BasketballEvents.Team} with wrong compare`, async () => {
      const data: EssentialConditionData[] = [
        {
          options: [
            {
              event: BasketballEvents.Team,
              compare: CompareOp.Equal,
              targets: [ "wrong" ],
            },
            {
              event: BasketballEvents.TeamScores3FG,
              compare: CompareOp.Equal,
              targets: [
                "2"
              ]
            },
          ],
        },
      ]

      await assert.rejects(
        ctx.triggerConditionCollection.add(ctx.triggerId, datasource, sport, scope, scopeId, data),
        (err: Error) => {
          ctx.log.debug({ err }, "adding condition raised error")
          assert(err)
          assert.equal(err.name.includes("ArgumentError"), true)
          assert.equal(err.message.includes("should have compare one of"), true)
          return true
        })
    })

    it(`should get triggers by event ${BasketballEvents.Player} and scope`, async () => {
      const items = await ctx.triggerConditionCollection
        .getTriggerListByScopeAndEventName(datasource, scope, scopeId, BasketballEvents.Player)
      assert.ok(items.length)
      ctx.log.debug({ items }, `list of triggers`)
    })

    it('should get conditions by trigger id', async () => {
      const conditions = await ctx.triggerConditionCollection.getByTriggerId(ctx.triggerId)
      assert.ok(conditions.length > 0)
      ctx.log.debug({ conditions }, `conditions`)
    })
  })



})
