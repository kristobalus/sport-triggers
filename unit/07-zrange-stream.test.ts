// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { TriggerConditionCollection, subscribedToScopeAndEvent } from "../src/repositories/trigger-condition.collection"
import IORedis, { Redis } from "ioredis"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Defer } from "../src/utils/defer"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { FootballEvents } from "../src/configs/definitions/football/football-events"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { GameLevel } from "../src/configs/definitions/football/football-game-level"
// import { EssentialSubscriptionData } from "../src/models/dto/trigger-subscribe-request"
import { Scope } from "../src/models/entities/trigger"
import { randomUUID } from "crypto"
import { ZRangeStream } from "../src/repositories/streams/zrange.stream"

describe("Test zrange stream", function () {

  const scope = Scope.Game
  const scopeId = randomUUID()
  const datasource = "sportradar"
  const entity = "moderation"
  const entityId = randomUUID()

  const ctx: {
    id?: string
    redis?: Redis
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection
    triggerId?: string
  } = {}

  before(async () => {
    ctx.redis = new IORedis({
      keyPrefix: '{triggers}',
    })
    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
  })

  before(async () => {

    await ctx.redis.flushall()

    const triggerData: EssentialTriggerData = {
      name: "...",
      description: "...",
      datasource,
      scope,
      scopeId,
      entity,
      entityId
    }

    const triggerConditions: EssentialConditionData[] = [
      {
        event: FootballEvents.GamePointsHome,
        compare: CompareOp.GreaterOrEqual,
        targets: "30",
        options: []
      },
      {
        event: FootballEvents.GameLevel,
        compare: CompareOp.Equal,
        targets: GameLevel.End,
        options: []
      },
    ]

    ctx.triggerId = await ctx.triggers.add(triggerData)
    await ctx.conditions.add(ctx.triggerId, datasource, scope, scopeId, triggerConditions)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it('should create stream from trigger set', async () => {
    const deferred = new Defer()
    const stream = new ZRangeStream({
      key: subscribedToScopeAndEvent(datasource, scope, scopeId, FootballEvents.GamePointsHome),
      redis: ctx.redis,
    })
    stream.on("close", () => {
      console.log('stream closed')
      deferred.resolve()
    })
    stream.on("data", (data) => {
      console.log('received!', data)
    })
    await deferred.promise
  })

})
