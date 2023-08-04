// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import IORedis, { Redis } from "ioredis"
import { Trigger } from "../src/models/entities/trigger"
import { EventCollection, parse } from "../src/repositories/event.collection"
import { randomUUID } from "crypto"
import { AdapterEvent } from "../src/models/events/adapter-event"
import { BasketballEvents } from "../src/sports/basketball/basketball-events"
import assert = require("assert")
import { metadata } from "../src/sports"
import pino, { Logger } from "pino"

describe("EventCollection", function () {

  // const datasource = "sportradar"
  // const scope = Scope.Game
  // const scopeId = randomUUID()
  // const entity = "moderation"
  // const entityId = randomUUID()

  const ctx: {
    log?: Logger
    triggerId?: string
    trigger?: Trigger
    redis?: Redis
    events?: EventCollection
    eventId?: string
    scopeId?: string
    playerId? :string
    playerId2? :string
    teamId?: string
  } = {}

  before(async () => {
    ctx.log = pino({ name: "test", level: "trace" })
    ctx.redis = new IORedis()
    ctx.events = new EventCollection(ctx.redis)
    ctx.scopeId = randomUUID()
    ctx.playerId = randomUUID()
    ctx.teamId = randomUUID()
    ctx.eventId = randomUUID()
    await ctx.redis.flushall()
  })

  after(async () => {
    ctx.redis.disconnect()
    await new Promise(r => setTimeout(r, 1000))
  })


  it('should executeQuery', async () => {
    const query = [
      "ft.create", "index", "on", "json",
      "prefix", "1", "event:",
      "schema",
      "$.id", "as", "id", "tag",
      "$.timestamp", "as", "timestamp", "numeric", "sortable",
      "$.options.[basketball.team.scores.3fg]", "as", "team_scores_3fg", "tag",
      "$.options.[basketball.team]", "as", "team", "tag",
      "$.events", "as", "events", "tag"
    ]
    const result = await ctx.events.execute(["ft._list"])
    ctx.log.debug(result)
    const result2 = await ctx.events.execute(query)
    ctx.log.debug(result2)
    const result3 = await ctx.events.execute(["ft._list"])
    ctx.log.debug(result3)
    await assert.rejects(async () => {
      await ctx.events.execute(query)
    }, (err: Error) => {
      ctx.log.debug(err.message)
      assert.equal(err.message, "Index already exists")
      return true
    })
    await ctx.events.dropIndex("index")
  })

  it('should createIndex', async () => {
    const datasource = "sportradar"
    const sport = "basketball"
    const scopeId = ctx.scopeId
    const result = await ctx.events.createIndex(datasource, sport, scopeId)
    assert.equal(result, true)
  })

  it('should append event', async () => {
    const datasource = "sportradar"
    const sport = "basketball"
    const scope = "game"
    const scopeId = ctx.scopeId
    const player = ctx.playerId
    const team = ctx.teamId

    const result1 = await ctx.events.append({
      id: ctx.eventId,
      datasource,
      scope,
      scopeId,
      sport,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.Player]: player,
        [BasketballEvents.Team]: team,
        [BasketballEvents.PlayerScores3FG]: player,
        [BasketballEvents.TeamScores3FG]: team
      }
    } as AdapterEvent)
    assert.equal(result1, true)

    ctx.playerId2 = randomUUID()
    const result2 = await ctx.events.append({
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.Player]: ctx.playerId2,
        [BasketballEvents.Team]: team,
        [BasketballEvents.PlayerScores3FG]: randomUUID(),
        [BasketballEvents.TeamScores3FG]: team
      }
    } as AdapterEvent)
    assert.equal(result2, true)

    const result3 = await ctx.events.execute(["ft._list"])
    ctx.log.debug(result3)
    assert.equal(result3.length , 1)
  })

  it('should get event', async () => {
    const datasource = "sportradar"
    const sport = "basketball"

    const result = await ctx.events.getItem(datasource, sport, ctx.scopeId, ctx.eventId)
    ctx.log.debug(JSON.stringify(result, null ,2))
  })

  it('should aggregate', async () => {
    const datasource = "sportradar"
    const query = metadata[BasketballEvents.PlayerScores3FG].aggregate(datasource, ctx.scopeId, [ ctx.playerId, ctx.playerId2 ])

    ctx.log.debug(query)

    const { count } = parse(await ctx.events.execute(query))

    ctx.log.debug({ count }, `after aggregation`)
  })


})
