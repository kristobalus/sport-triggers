// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { TriggerConditionCollection, triggerSetByScopeAndEvent } from "../src/repositories/trigger-condition.collection"
import IORedis, { Redis } from "ioredis"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { Defer } from "../src/utils/defer"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { FootballEvents } from "../src/models/events/football/football-events"
import { CompareOp } from "../src/models/entities/trigger-condition"
import { GameLevel } from "../src/models/events/football/football-game-level.event"
// import { EssentialSubscriptionData } from "../src/models/dto/trigger-subscribe-request"
import { Scope } from "../src/models/entities/trigger"
import { randomUUID } from "crypto"
import { ZRangeStream } from "../src/repositories/streams/zrange.stream"

describe("Test zrange stream", function () {

  const scope = Scope.SportradarGames
  const scopeId = randomUUID()

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

    const triggerData = {
      name: "...",
      description: "...",
      scope,
      scopeId,
    } as EssentialTriggerData

    const triggerConditions: EssentialConditionData[] = [
      {
        event: FootballEvents.GamePointsHome,
        compare: CompareOp.GreaterOrEqual,
        target: "30",
      },
      {
        event: FootballEvents.GameLevel,
        compare: CompareOp.Equal,
        target: GameLevel.End,
      },
    ]

    ctx.triggerId = await ctx.triggers.add(triggerData)
    await ctx.conditions.add(ctx.triggerId, scope, scopeId, triggerConditions)
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it('should create stream from trigger set', async () => {
    const deferred = new Defer()
    const stream = new ZRangeStream({
      key: triggerSetByScopeAndEvent(scope, scopeId, FootballEvents.GamePointsHome),
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
