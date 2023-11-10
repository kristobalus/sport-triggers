// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from 'ioredis'
import assert from 'assert'
import { randomUUID } from 'crypto'

import {
  conditionKey,
  conditionLogKey,
  TriggerConditionCollection,
} from '../src/repositories/trigger-condition.collection'
import { TriggerCollection } from '../src/repositories/trigger.collection'
import { Scope, Trigger } from '../src/models/entities/trigger'
import { EventSnapshot } from '../src/models/events/event-snapshot'
import { CompareOp } from '../src/models/entities/trigger-condition'
import { initStandaloneRedis } from './helper/init-standalone-redis'
import { EssentialConditionData, EssentialTriggerData } from '../src/models/dto/trigger-create-request'
import { BasketballEvents } from '../src/sports/basketball/basketball-events'
import { pino } from 'pino'
import { ScopeSnapshotCollection } from '../src/repositories/scope-snapshot.collection'
import { ScopeSnapshot } from '../src/models/events/scope-snapshot'
import { Sport } from '../src/models/events/sport'

describe("set_and_compare.lua", function () {

  const log = pino({ name: "test", level: "trace", transport: { target: "pino-pretty" } })
  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "moderation"
  const sport = Sport.Basketball
  const entityId = randomUUID()
  const playerId = randomUUID()

  const ctx: {
    redis?: Redis
    triggerId?: string
    trigger?: Trigger
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection
    events?: ScopeSnapshotCollection
    conditionKey?: string
    conditionLogKey?: string
  } = {}

  before(async () => {

    ctx.redis = await initStandaloneRedis()
    await ctx.redis.flushall()

    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
    ctx.events = new ScopeSnapshotCollection(ctx.redis)

    const triggerData: EssentialTriggerData = {
      name: "...",
      description: "...",
      datasource,
      sport,
      scope,
      scopeId,
      entity,
      entityId,
    }
    ctx.triggerId = await ctx.triggers.add(triggerData)
    ctx.trigger = await ctx.triggers.getOne(ctx.triggerId)

    const conditionData: EssentialConditionData[] = [
      {
        event: BasketballEvents.Player,
        compare: CompareOp.In,
        targets: [ playerId ],
        options: [
          {
            event: BasketballEvents.PlayerScores3FG,
            compare: CompareOp.Equal,
            targets: [ "1" ],
          },
        ],
      },
    ]

    await ctx.conditions.add(ctx.triggerId, datasource, sport, scope, scopeId, conditionData)

    const [ condition ] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    ctx.conditionKey = conditionKey(condition.id)
    ctx.conditionLogKey = conditionLogKey(condition.id)
  })

  after(async () => {
    ctx.redis.disconnect()
    await new Promise(r => setTimeout(r, 1000))
  })

  it(`should not activate condition when compare main event failed`, async () => {

    await ctx.events.append({
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      sport: Sport.Basketball,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.Team]: playerId,
        [BasketballEvents.PlayerScores3FG]: playerId
      },
    } as ScopeSnapshot)

    const event: EventSnapshot = {
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      sport: Sport.Basketball,
      scopeId: scopeId,
      timestamp: Date.now(),
      name: BasketballEvents.Team,
      value: playerId,
      options: {
        [BasketballEvents.PlayerScores3FG]: playerId,
        [BasketballEvents.Team]: playerId
      },
    }

    const [result, debug] = await ctx.redis.set_and_compare(2,
      ctx.conditionKey,
      ctx.conditionLogKey,
      JSON.stringify(event))
    log.debug({ debug: JSON.parse(debug) }, `debug`)

    assert.equal(result, 0)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, false)
  })

  it(`should not activate condition when compare options failed`, async () => {

    await ctx.events.append({
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      sport: Sport.Basketball,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.Player]: playerId,
        [BasketballEvents.TeamScores3FG]: playerId
      },
    } as ScopeSnapshot)

    const event: EventSnapshot = {
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      sport: Sport.Basketball,
      timestamp: Date.now(),
      name: BasketballEvents.Player,
      value: playerId,
      options: {
        [BasketballEvents.Player]: playerId,
        [BasketballEvents.TeamScores3FG]: playerId
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

    await ctx.events.append({
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      sport: Sport.Basketball,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.Player]: playerId,
        [BasketballEvents.PlayerScores3FG]: playerId
      },
    } as ScopeSnapshot)

    const event: EventSnapshot = {
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      sport: Sport.Basketball,
      timestamp: Date.now(),
      name: BasketballEvents.Player,
      value: playerId,
      options: {
        [BasketballEvents.PlayerScores3FG]: playerId,
        [BasketballEvents.Player]: playerId
      },
    }

    const [result, debug] = await ctx.redis.set_and_compare(2,
      ctx.conditionKey, // conditionKey
      ctx.conditionLogKey,
      JSON.stringify(event)
    )
    log.debug({ debug: JSON.parse(debug) }, `debug`)
    assert.equal(result, 1)

    const [condition] = await ctx.conditions.getByTriggerId(ctx.triggerId)
    assert.equal(condition.activated, true)
  })

  it(`once being activated condition should not be changed by further events`, async () => {

    await ctx.events.append({
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      sport: Sport.Basketball,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.Player]: playerId,
        [BasketballEvents.PlayerScores3FG]: playerId
      },
    } as ScopeSnapshot)

    const event: EventSnapshot = {
      id: randomUUID(),
      datasource: datasource,
      scope: scope,
      scopeId: scopeId,
      sport: Sport.Basketball,
      timestamp: Date.now(),
      name: BasketballEvents.Player,
      value: playerId,
      options: {
        [BasketballEvents.PlayerScores3FG]: playerId,
        [BasketballEvents.Player]: playerId
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
