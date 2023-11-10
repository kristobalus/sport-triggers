// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from 'ioredis'
import pino from 'pino'
import assert from 'assert'
import pretty from 'pino-pretty'

import { EventSnapshot } from '../src/models/events/event-snapshot'
import { Scope, Trigger } from '../src/models/entities/trigger'
import { AdapterService, AdapterServiceOptions } from '../src/services/adapter/adapter.service'
import { AMQPTransport, Publish } from '@microfleet/transport-amqp'
import { randomUUID } from 'crypto'
import { StudioService, StudioServiceOptions } from '../src/services/studio/studio.service'
import { EssentialConditionData, EssentialTriggerData } from '../src/models/dto/trigger-create-request'
import { CompareOp } from '../src/models/entities/trigger-condition'
import { TriggerConditionCollection } from '../src/repositories/trigger-condition.collection'
import { TriggerCollection } from '../src/repositories/trigger.collection'
import { TriggerSubscriptionCollection } from '../src/repositories/trigger-subscription.collection'
import { initStandaloneRedis } from './helper/init-standalone-redis'
import { EssentialSubscriptionData } from '../src/models/dto/trigger-subscribe-request'
import { BasketballEvents } from '../src/sports/basketball/basketball-events'
import { Microfleet } from '@microfleet/core-types'
import { TriggerLimitCollection } from '../src/repositories/trigger-limit.collection'
import { ScopeSnapshotCollection } from '../src/repositories/scope-snapshot.collection'
import { EntityLimitCollection } from '../src/repositories/entity-limit.collection'
import { ScopeSnapshot } from '../src/models/events/scope-snapshot'
import { Sport } from '../src/models/events/sport'

interface TestContext {
  redis?: Redis,
  log?: Microfleet['log'],
  adapterService?: AdapterService,
  studioService?: StudioService,
  triggerCollection?: TriggerCollection
  conditionCollection?: TriggerConditionCollection
  subscriptionCollection?: TriggerSubscriptionCollection
  triggerLimitCollection?: TriggerLimitCollection,
  snapshotCollection?: ScopeSnapshotCollection,
  entityLimitCollection?: EntityLimitCollection
  notifications: any[],
  trigger?: Trigger,
  triggerId?: string
}

describe("AdapterService", function () {

  const datasource = "sportradar"
  const sport = Sport.Basketball
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "moderation"
  const entityId = randomUUID()
  const homeId = randomUUID()
  const awayId = randomUUID()

  const ctx: TestContext = {
    notifications: [],
  }

  before(async () => {

    ctx.redis = await initStandaloneRedis()

    const log = pino({
      name: "AdapterService",
      level: "debug",
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    })) as Microfleet['log']

    const amqp = {
      async publishAndWait<T = any>(route: string, message: any, options?: Publish): Promise<T> {
        ctx.notifications.push({ route, message, options })
        return {} as T
      },
    } as AMQPTransport

    ctx.log = log
    ctx.triggerCollection = new TriggerCollection(ctx.redis)
    ctx.conditionCollection = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptionCollection = new TriggerSubscriptionCollection(ctx.redis)
    ctx.triggerLimitCollection = new TriggerLimitCollection(ctx.redis)
    ctx.snapshotCollection = new ScopeSnapshotCollection(ctx.redis)
    ctx.entityLimitCollection = new EntityLimitCollection(ctx.redis)

    ctx.adapterService = new AdapterService({
      log,
      redis: ctx.redis,
      amqp,
      triggerCollection: ctx.triggerCollection,
      conditionCollection: ctx.conditionCollection,
      subscriptionCollection: ctx.subscriptionCollection,
      triggerLimitCollection: ctx.triggerLimitCollection,
      scopeSnapshotCollection: ctx.snapshotCollection,
      entityLimitCollection: ctx.entityLimitCollection,
    } as AdapterServiceOptions)

    ctx.studioService = new StudioService({
      log,
      redis: ctx.redis,
      triggerCollection: ctx.triggerCollection,
      conditionCollection: ctx.conditionCollection,
      subscriptionCollection: ctx.subscriptionCollection,
      triggerLimitCollection: ctx.triggerLimitCollection,
    } as StudioServiceOptions)

  })

  after(async () => {
    ctx.redis.disconnect()
  })

  describe('single condition', function () {

    before(async () => {
      await ctx.redis.flushall()

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

      const conditionData: EssentialConditionData[] = [
        {
          event: BasketballEvents.TeamShootingFoul,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: ["2"],
            },
          ],
        },
      ]

      ctx.triggerId = await ctx.studioService.createTrigger(triggerData, conditionData)
      const result = await ctx.studioService.getTrigger(ctx.triggerId)
      ctx.trigger = result.trigger

      const subscriptionData = {
        route: "some.route",
        payload: { id: 1 },
      } as EssentialSubscriptionData

      await ctx.studioService.subscribeTrigger(ctx.triggerId, subscriptionData)
    })

    it(`should create trigger for TeamShootingFoul in Sequence 2`, async () => {
      assert.ok(ctx.trigger)
      assert.ok(ctx.triggerId)
      assert.ok(ctx.trigger.id)
      assert.equal(ctx.triggerId, ctx.trigger.id)
      const [ condition ] = await ctx.conditionCollection.getByTriggerId(ctx.triggerId)
      assert.ok(condition)
      assert.equal(condition.event, BasketballEvents.TeamShootingFoul)
      const [ option ] = condition.options
      assert.equal(option.event, BasketballEvents.Sequence)
      assert.deepEqual(option.targets, ["2"])
    })

    it(`should not activate trigger for TeamShootingFoul in Sequence 1`, async () => {

      const scopeSnapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Team]: homeId,
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Sequence]: 1, // expected sequence is 2
        },
      }

      const result = await processScopeSnapshot(ctx, scopeSnapshot)
      assert.equal(result, false)
    })

    it(`should activate trigger for TeamShootingFoul in Sequence 2`, async () => {

      const scopeSnapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Team]: homeId,
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Sequence]: 2, // expected sequence is 2
        },
      }

      await ctx.adapterService.storeScopeSnapshot(scopeSnapshot)

      const event: EventSnapshot = {
        name: BasketballEvents.TeamShootingFoul,
        value: homeId,
        ...scopeSnapshot
      }

      const result = await ctx.adapterService.evaluateTrigger(event, ctx.trigger.id)
      assert.equal(result, true)
    })
  })

  const processScopeSnapshot = async (ctx: TestContext, snapshot: ScopeSnapshot) => {
    ctx.log.debug({ snapshotId: snapshot.id }, `processing snapshot`)

    await ctx.adapterService.storeScopeSnapshot(snapshot)

    for(const [name, value] of Object.entries(snapshot.options)) {
      const eventSnapshot: EventSnapshot = {
        ...{ name: name, value: String(value) },
        ...snapshot,
      }

      const result = await ctx.adapterService.evaluateTrigger(eventSnapshot, ctx.trigger.id)

      if (result) {
        return result
      }
    }

    return false
  }

  describe('single condition with aggregation for 2 TeamScores3FG', function () {

    before(async () => {

      await ctx.redis.flushall()
      ctx.snapshotCollection.clearIndices()

      const triggerData: EssentialTriggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        sport,
        scopeId,
        entity,
        entityId,
      }

      const conditionData: EssentialConditionData[] = [
        {
          event: BasketballEvents.Team,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.TeamScores3FG,
              compare: CompareOp.Equal,
              targets: ["2"],
            },
          ],
        },
      ]

      ctx.triggerId = await ctx.studioService.createTrigger(triggerData, conditionData)
      const result = await ctx.studioService.getTrigger(ctx.triggerId)

      ctx.trigger = result.trigger

      const subscriptionData = {
        route: "some.route",
        payload: { id: 1 },
      } as EssentialSubscriptionData

      await ctx.studioService.subscribeTrigger(ctx.triggerId, subscriptionData)
    })

    it(`should activate trigger after two succeeding snapshots with TeamScores3FG`, async () => {

      // flow of snapshots
      const snapshots = [
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamScores3FG]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamScores3FG]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: "basketball",
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamScores3FG]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: "basketball",
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamScores3FG]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 1,
          },
        },
      ]

      const results = []

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        results.push(result)
      }

      assert.equal(results.length, 4)
      assert.equal(results[3], true)
    })
  })

  describe('single condition loop', function () {
    before(async () => {

      await ctx.redis.flushall()
      ctx.snapshotCollection.clearIndices()

      const triggerData: EssentialTriggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        sport,
        scopeId,
        entity,
        entityId,
      }

      const conditionData: EssentialConditionData[] = [
        {
          event: BasketballEvents.Team,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.TeamDunk,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
          ],
        },
      ]

      ctx.triggerId = await ctx.studioService.createTrigger(triggerData, conditionData)
      const { trigger } = await ctx.studioService.getTrigger(ctx.triggerId)
      ctx.trigger = trigger
    })

    it(`should create trigger`, async () => {
      assert.ok(ctx.trigger)
      assert.ok(ctx.triggerId)
      assert.equal(ctx.triggerId, ctx.trigger.id)
    })

    it(`should be activated on first run`, async () => {

      const snapshots = [
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 1,
          },
        }
      ]

      const results = []
      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        results.push(result)
      }

      const [result] = results
      assert.equal(result, true)
    })

    it(`should be reset to initial state after activation`, async () => {
      const [ condition ] = await ctx.conditionCollection.getByTriggerId(ctx.triggerId)
      assert.equal(condition.activated, false)
    })

    it(`should not be activated on wrong event`, async () => {

      const snapshots = [
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 2,
          },
        }
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should be activated  on second run`, async () => {

      const snapshots = [
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 2,
          },
        }
      ]

      const results = []
      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        results.push(result)
      }

      const [result]  = results
      assert.equal(result, true)
    })
  })

  describe('single condition loop with limit "1 per sequence"', function () {
    before(async () => {

      await ctx.redis.flushall()
      ctx.snapshotCollection.clearIndices()

      const triggerData: EssentialTriggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        sport,
        scopeId,
        entity,
        entityId,
      }

      const conditionData: EssentialConditionData[] = [
        {
          event: BasketballEvents.Team,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.TeamDunk,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
          ],
        },
      ]

      const triggerId = await ctx.studioService.createTrigger(triggerData, conditionData)
      const result = await ctx.studioService.getTrigger(triggerId)

      ctx.trigger = result.trigger

      const subscriptionData = {
        route: "some.route",
        payload: { id: 1 },
      } as EssentialSubscriptionData

      await ctx.studioService.subscribeTrigger(triggerId, subscriptionData)
      await ctx.studioService.setTriggerLimits(triggerId, {
        [BasketballEvents.Sequence]: 1
      })
    })

    it(`should be activated in sequence 1 on first run`, async () => {

      const snapshots = [
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 1,
          },
        },
      ]

      const results = []
      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        results.push(result)
      }

      const [result] = results
      assert.equal(result, true)
    })

    it(`should be skipped in sequence 1 on second run`, async () => {

      const snapshots = [
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 1,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 1,
          },
        },
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should be activated in sequence 2 on first run`, async () => {

      const snapshots = [
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 2,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 2,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 2,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 2,
          },
        },
      ]

      const results = []
      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        results.push(result)
      }

      const [result]  = results
      assert.equal(result, true)
    })

    it(`should be skipped in sequence 2 on second run`, async () => {

      const snapshots = [
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 2,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 2,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: awayId,
            [BasketballEvents.Team]: awayId,
            [BasketballEvents.Sequence]: 2,
          },
        },
        {
          id: randomUUID(),
          datasource,
          scope,
          scopeId,
          sport: Sport.Basketball,
          timestamp: Date.now(),
          options: {
            [BasketballEvents.TeamDunk]: homeId,
            [BasketballEvents.Team]: homeId,
            [BasketballEvents.Sequence]: 2,
          },
        },
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })
  })

  describe('multiple conditions w/o aggregations', function () {

    before(async () => {
      ctx.notifications = []

      await ctx.redis.flushall()
      ctx.snapshotCollection.clearIndices()

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

      const triggerConditions: EssentialConditionData[] = [
        {
          event: BasketballEvents.Team,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.TeamShootingFoul,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: ["1"],
            },
          ],
        },
        {
          event: BasketballEvents.Team,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.TeamShootingFoul,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: ["2"],
            },
          ],
        },
      ]

      const triggerId = await ctx.studioService.createTrigger(triggerData, triggerConditions)
      const result = await ctx.studioService.getTrigger(triggerId)
      ctx.trigger = result.trigger

      // const subscriptionData = {
      //   route: "some.route2",
      //   payload: { foo: "bar" }
      // } as EssentialSubscriptionData
      //
      // await ctx.studioService.subscribeTrigger(triggerId, subscriptionData)
    })

    it(`should activate first condition in sequence 1, trigger not activated`, async () => {

      const snapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport: "basketball",
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Sequence]: 1,
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Team]: homeId,
        },
      }

      const result = await processScopeSnapshot(ctx, snapshot)
      assert.equal(result, false)

      const [condition1, condition2] = await ctx.conditionCollection.getByTriggerId(ctx.trigger.id)
      ctx.log.debug({
        "condition1.id": condition1.id,
        "condition1.activated": condition1.activated,
        "condition2.id": condition2.id,
        "condition2.activated": condition2.activated
      })

      assert.equal(condition1.activated, true)
      assert.equal(condition2.activated, false)
    })

    it(`should activate second condition in sequence 2, trigger activated`, async () => {

      const snapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport: "basketball",
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Sequence]: 2,
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Team]: homeId,
        },
      }

      const result = await processScopeSnapshot(ctx, snapshot)
      assert.equal(result, true)
    })
  })

  describe('methods', function () {

    const triggers = []

    before(async () => {
      ctx.notifications = []
      await ctx.redis.flushall()

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

      const triggerConditions: EssentialConditionData[] = [
        {
          event: BasketballEvents.TeamShootingFoul,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: ["1"],
            },
          ],
        },
        {
          event: BasketballEvents.TeamShootingFoul,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: ["2"],
            },
          ],
        },
      ]

      const triggerId1 = await ctx.studioService.createTrigger(triggerData, triggerConditions)
      const triggerId2 = await ctx.studioService.createTrigger(triggerData, triggerConditions)
      triggers.push(triggerId1, triggerId2)
    })

    it(`getTriggers`, async () => {

      const event: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Team]: homeId,
          [BasketballEvents.TeamDunk]: homeId,
          [BasketballEvents.Sequence]: 1,
        },
      }

      for await (const chunk of ctx.adapterService.getTriggersBySnapshot(event)) {
        for(const trigger of chunk) {
          assert.equal(triggers.includes(trigger), true)
        }
      }
    })
  })

  describe('disabled trigger', function () {

    before(async () => {
      await ctx.redis.flushall()
      ctx.snapshotCollection.clearIndices()

      const triggerData: EssentialTriggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        sport,
        scopeId,
        entity,
        entityId,
      }

      const conditionData: EssentialConditionData[] = [
        {
          event: BasketballEvents.Team,
          compare: CompareOp.In,
          targets: [homeId],
          options: [
            {
              event: BasketballEvents.Sequence,
              compare: CompareOp.Equal,
              targets: ["2"],
            },
            {
              event: BasketballEvents.TeamShootingFoul,
              compare: CompareOp.Equal,
              targets: [homeId],
            },
          ],
        },
      ]

      const triggerId = await ctx.studioService.createTrigger(triggerData, conditionData)
      const result = await ctx.studioService.getTrigger(triggerId)
      ctx.trigger = result.trigger
    })

    it(`should disable trigger`, async () => {
      await ctx.studioService.disableTrigger(ctx.trigger.id)
    })

    it(`should not activate disabled trigger`, async () => {

      const snapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport: "basketball",
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Team]: homeId,
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Sequence]: 2,
        },
      }

      const result = await processScopeSnapshot(ctx, snapshot)
      assert.equal(result, false)
    })

    it(`should enable trigger`, async () => {
      await ctx.studioService.enableTrigger(ctx.trigger.id)
    })

    it(`should activate enabled trigger`, async () => {

      const snapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        sport,
        scopeId,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Team]: homeId,
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Sequence]: 2,
        },
      }

      const result = await processScopeSnapshot(ctx, snapshot)
      assert.equal(result, true)
    })
  })

})
