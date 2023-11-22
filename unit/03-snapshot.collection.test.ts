// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import IORedis, { Redis } from "ioredis"
import { Trigger } from "../src/models/entities/trigger"
import { AggregateResult, ScopeSnapshotCollection } from "../src/repositories/scope-snapshot.collection"
import { randomUUID } from "crypto"
import { ScopeSnapshot } from "../src/models/events/scope-snapshot"
import { BasketballEvents } from "../src/sports/basketball/basketball-events"
import assert = require("assert")
import { metadata } from "../src/sports"
import pino, { Logger } from "pino"

export function parse(result): AggregateResult {
  const [, data] = result

  const reduced = {}

  for (let i = 0; i < data.length; i++) {
    if ( i % 2 == 0 ) {
      reduced[data[i]] = data[i + 1]
    }
  }

  return reduced
}

describe("SnapshotCollection", function () {

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
    snapshotCollection?: ScopeSnapshotCollection
    snapshotId?: string
    scopeId?: string
    playerId? :string
    playerId2? :string
    teamId?: string
  } = {}

  before(async () => {
    ctx.log = pino({ name: "test", level: "trace" })
    ctx.redis = new IORedis()
    ctx.snapshotCollection = new ScopeSnapshotCollection(ctx.redis)
    ctx.scopeId = randomUUID()
    ctx.playerId = randomUUID()
    ctx.teamId = randomUUID()
    ctx.snapshotId = randomUUID()
    await ctx.redis.flushall()
  })

  after(async () => {
    ctx.redis.disconnect()
    await new Promise(r => setTimeout(r, 1000))
  })

  it('should execute query', async () => {
    const query = [
      "ft.create", "index", "on", "json",
      "prefix", "1", "event:",
      "schema",
      "$.id", "as", "id", "tag",
      "$.timestamp", "as", "timestamp", "numeric", "sortable",
      `$.options.[basketball.team.scores.3fg]`, "as", "team_scores_3fg", "tag",
      "$.options.[basketball.team]", "as", "team", "tag",
      "$.events", "as", "events", "tag"
    ]
    const result = await ctx.snapshotCollection.execute(["ft._list"])
    ctx.log.debug(result)

    const result2 = await ctx.snapshotCollection.execute(query)
    ctx.log.debug(result2)

    const result3 = await ctx.snapshotCollection.execute(["ft._list"])
    ctx.log.debug(result3)

    await assert.rejects(async () => {
      await ctx.snapshotCollection.execute(query)
    }, (err: Error) => {
      ctx.log.debug(err.message)
      assert.equal(err.message, "Index already exists")
      return true
    })

    await ctx.snapshotCollection.dropIndex("index")
  })

  it('should createIndex', async () => {
    const datasource = "sportradar"
    const sport = "basketball"
    const scope = "game"
    const scopeId = ctx.scopeId
    const result = await ctx.snapshotCollection.createIndex(datasource, sport, scope, scopeId)
    assert.equal(result, true)
  })

  it('should append event', async () => {
    const datasource = "sportradar"
    const sport = "basketball"
    const scope = "game"
    const scopeId = ctx.scopeId
    const player = ctx.playerId
    const team = ctx.teamId

    // should add one snapshot
    const result1 = await ctx.snapshotCollection.append({
      id: ctx.snapshotId,
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
    } as ScopeSnapshot)
    assert.equal(result1, true)

    ctx.playerId2 = randomUUID()

    // should add second snapshot
    const result2 = await ctx.snapshotCollection.append({
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
    } as ScopeSnapshot)

    assert.equal(result2, true)

    // at least one index exists
    const result3 = await ctx.snapshotCollection.execute(["ft._list"])
    ctx.log.debug(result3)
    assert.equal(result3.length , 1)

    const count = await ctx.snapshotCollection.count(datasource, sport, scope, scopeId)
    assert.equal(count, 2)
  })

  it('should get event', async () => {
    const datasource = "sportradar"
    const sport = "basketball"
    const scope = "game"

    const result = await ctx.snapshotCollection.getItem(datasource, sport, scope, ctx.scopeId, ctx.snapshotId)
    ctx.log.debug(JSON.stringify(result, null ,2))
  })

  it('should aggregate', async () => {
    const datasource = "sportradar"
    const sport = "basketball"
    const scope = "game"
    const query = metadata[BasketballEvents.PlayerScores3FG]
      .aggregate(datasource, sport, scope, ctx.scopeId, [ ctx.playerId, ctx.playerId2 ])

    ctx.log.debug(query)

    const { count } = parse(await ctx.snapshotCollection.execute(query))

    ctx.log.debug({ count }, `after aggregation`)
  })


})
