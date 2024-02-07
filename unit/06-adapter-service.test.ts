// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis } from 'ioredis'
import pino from 'pino'
import assert from 'assert'
import pretty from 'pino-pretty'

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
import { getEventUriListBySnapshot, ScopeSnapshot } from '../src/models/events/scope-snapshot'
import { Sport } from '../src/models/events/sport'
import { CommonLimit, limits as CommonLimits } from '../src/sports/common-limits'

interface UnitTestContext {
  redis?: Redis,
  log?: Microfleet['log'],
  adapterService?: AdapterService,
  studioService?: StudioService,
  triggerCollection?: TriggerCollection
  triggerConditionCollection?: TriggerConditionCollection
  subscriptionCollection?: TriggerSubscriptionCollection
  triggerLimitCollection?: TriggerLimitCollection,
  snapshotCollection?: ScopeSnapshotCollection,
  entityLimitCollection?: EntityLimitCollection
  notifications: any[],
  trigger?: Trigger,
  triggerId?: string
  limits?: Record<string, number>
}

describe("AdapterService", function () {

  this.timeout(120_000)

  const datasource = "sportradar"
  const sport = Sport.Basketball
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "question"
  const entityId = randomUUID()
  const homeId = randomUUID()
  const awayId = randomUUID()
  const player3fg = randomUUID()

  const ctx: UnitTestContext = {
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
      async publish<T = any>(route: string, message: any, options?: Publish): Promise<T> {
        ctx.notifications.push({ route, message, options })
        return {} as T
      },
    } as AMQPTransport

    ctx.log = log
    ctx.triggerCollection = new TriggerCollection(ctx.redis)
    ctx.triggerConditionCollection = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptionCollection = new TriggerSubscriptionCollection(ctx.redis)
    ctx.triggerLimitCollection = new TriggerLimitCollection(ctx.redis)
    ctx.snapshotCollection = new ScopeSnapshotCollection(ctx.redis)
    ctx.entityLimitCollection = new EntityLimitCollection(ctx.redis)

    ctx.adapterService = new AdapterService({
      log,
      redis: ctx.redis,
      amqp,
      triggerCollection: ctx.triggerCollection,
      conditionCollection: ctx.triggerConditionCollection,
      subscriptionCollection: ctx.subscriptionCollection,
      triggerLimitCollection: ctx.triggerLimitCollection,
      scopeSnapshotCollection: ctx.snapshotCollection,
      entityLimitCollection: ctx.entityLimitCollection,
    } as AdapterServiceOptions)

    ctx.studioService = new StudioService({
      log,
      redis: ctx.redis,
      defaultLimits: {
        [CommonLimit.Scope]: 10
      },
      triggerCollection: ctx.triggerCollection,
      entityLimitCollection: ctx.entityLimitCollection,
      conditionCollection: ctx.triggerConditionCollection,
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
      const { trigger } = await ctx.studioService.getTrigger(ctx.triggerId)
      ctx.trigger = trigger

      const subscriptionData = {
        route: "some.route",
        payload: { id: 1 },
        entity: trigger.entity,
        entityId: trigger.entityId
      } as EssentialSubscriptionData

      await ctx.studioService.subscribeTrigger(ctx.triggerId, subscriptionData)
    })

    it(`should create trigger for TeamShootingFoul in Sequence 2`, async () => {
      assert.ok(ctx.trigger)
      assert.ok(ctx.triggerId)
      assert.ok(ctx.trigger.id)
      assert.equal(ctx.triggerId, ctx.trigger.id)
      const [ condition ] = await ctx.triggerConditionCollection.getByTriggerId(ctx.triggerId)
      assert.ok(condition)
      assert.ok(condition.options)
      const [ foulOption ] = condition.options.filter(option => option.event === BasketballEvents.TeamShootingFoul)
      const [ sequenceOption ] = condition.options.filter(option => option.event === BasketballEvents.Sequence)
      assert.ok(foulOption)
      assert.ok(sequenceOption)
      assert.deepEqual(foulOption.targets, [ homeId ])
      assert.deepEqual(sequenceOption.targets, ["2"])
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

      const result = await processScopeSnapshot(ctx, scopeSnapshot)
      assert.equal(result, true)
    })
  })

  const processScopeSnapshot = async (ctx: UnitTestContext, snapshot: ScopeSnapshot) => {
    ctx.log.debug({ snapshotId: snapshot.id }, `processing snapshot`)

    await ctx.adapterService.storeScopeSnapshot(snapshot)

    const result = await ctx.adapterService.evaluateTrigger(snapshot, ctx.trigger.id)

    if (result) {
      await ctx.adapterService.notify(ctx.triggerId, snapshot.id)
    }

    if (result) {
      return result
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
      const { trigger } = await ctx.studioService.getTrigger(ctx.triggerId)

      ctx.trigger = trigger

      const subscriptionData = {
        route: "some.route",
        payload: { id: 1 },
        entity: trigger.entity,
        entityId: trigger.entityId
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
          sport: Sport.Basketball,
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
        name: "...single condition loop trigger...",
        description: "...single condition loop trigger...",
        datasource,
        scope,
        sport,
        scopeId,
        entity,
        entityId,
      }

      const conditionData: EssentialConditionData[] = [
        {
          options: [
            {
              event: BasketballEvents.Team,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
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

    it(`should activate on first run`, async () => {

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

    it(`should reset condition to initial state after activation`, async () => {
      const [ condition ] = await ctx.triggerConditionCollection.getByTriggerId(ctx.triggerId)
      assert.equal(condition.activated, false)
    })

    it(`should not activate trigger on wrong run`, async () => {

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

    it(`should be activated on second run`, async () => {

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
        useLimits: true
      }

      const conditionData: EssentialConditionData[] = [
        {
          options: [
            {
              event: BasketballEvents.Team,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
            {
              event: BasketballEvents.TeamDunk,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
          ]
        },
      ]

      ctx.triggerId = await ctx.studioService.createTrigger(triggerData, conditionData, {
        [BasketballEvents.Sequence]: 1
      })

      const { trigger, limits } = await ctx.studioService.getTrigger(ctx.triggerId)
      ctx.trigger = trigger
      ctx.limits = limits

      const subscriptionData = {
        route: "interactive.question.triggered",
        payload: { id: 1 },
        entity: trigger.entity,
        entityId: trigger.entityId
      } as EssentialSubscriptionData

      await ctx.studioService.subscribeTrigger(ctx.triggerId, subscriptionData)
    })

    it(`should create trigger for home team and limit 1 per sequence`, async () => {
      assert.ok(ctx.trigger)
      assert.ok(ctx.triggerId)
      assert.equal(ctx.triggerId, ctx.trigger.id)
      assert.equal(ctx.limits[BasketballEvents.Sequence], 1)
    })

    it(`should not activate for away team`, async () => {

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
        }
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should activate for home team in sequence 1 on first run`, async () => {

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

    it(`should not activate for home team in sequence 1 on second run`, async () => {

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

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should activate for home team in sequence 2 on first run`, async () => {

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

    it(`should not activate for home team in sequence 2 on second run`, async () => {

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

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })
  })

  describe('single condition loop with limit "1 per scope"', function () {
    before(async () => {

      await ctx.redis.flushall()
      ctx.snapshotCollection.clearIndices()
      ctx.notifications = []

      const triggerData: EssentialTriggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        sport,
        scopeId,
        entity,
        entityId,
        useLimits: true
      }

      const conditionData: EssentialConditionData[] = [
        {
          options: [
            {
              event: BasketballEvents.TeamDunk,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
            {
              event: BasketballEvents.Team,
              compare: CompareOp.In,
              targets: [ homeId ],
            },
          ],
        },
      ]

      ctx.triggerId = await ctx.studioService.createTrigger(triggerData, conditionData, {
        [CommonLimit.Scope]: 1
      })

      const { trigger, limits } = await ctx.studioService.getTrigger(ctx.triggerId)
      ctx.trigger = trigger
      ctx.limits = limits

      const subscriptionData = {
        route: "some.route",
        payload: { id: 1 },
        entity: trigger.entity,
        entityId: trigger.entityId
      } as EssentialSubscriptionData

      await ctx.studioService.subscribeTrigger(ctx.triggerId, subscriptionData)
    })

    it(`should create trigger for home team and limit 1 per scope`, async () => {
      assert.ok(ctx.trigger)
      assert.ok(ctx.triggerId)
      assert.equal(ctx.triggerId, ctx.trigger.id)
      assert.equal(ctx.limits[CommonLimit.Scope], 1)
    })

    it(`should activate for home team in sequence 1 on first run`, async () => {

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

    it(`should not activate for home team in sequence 1 on second run`, async () => {

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
            [BasketballEvents.Sequence]: 1
          },
        }
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should not activate for home team in sequence 2 on first run`, async () => {

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
            [BasketballEvents.Sequence]: 2
          },
        }
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should not activate for home team in sequence 2 on second run`, async () => {

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
            [BasketballEvents.Sequence]: 2
          },
        }
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should not activate for home team in sequence 3 on first run`, async () => {

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
            [BasketballEvents.Sequence]: 3
          },
        }
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should not activate for home team in sequence 3 on second run`, async () => {

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
            [BasketballEvents.Sequence]: 3
          },
        }
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should set next to false in trigger notification`, async () => {
      const { trigger } = await ctx.studioService.getTrigger(ctx.triggerId)
      assert.equal(trigger.next, false)

      const [ notification ] = ctx.notifications
      ctx.log.debug({ notification }, 'trigger sent notification to subscribers')

      const { message } = notification ?? {}
      assert.notEqual(message.next, undefined)
      assert.equal(message.next, false)
    })
  })

  describe('single condition loop with limit "1 per minute"', function () {
    before(async () => {

      await ctx.redis.flushall()
      ctx.snapshotCollection.clearIndices()
      ctx.notifications = []

      const triggerData: EssentialTriggerData = {
        name: "...",
        description: "...",
        datasource,
        scope,
        sport,
        scopeId,
        entity,
        entityId,
        useLimits: true
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

      const triggerId = await ctx.studioService.createTrigger(triggerData, conditionData, {
        [CommonLimit.Minute]: 1
      })

      const { trigger, limits } = await ctx.studioService.getTrigger(triggerId)
      ctx.trigger = trigger
      ctx.limits = limits
      ctx.triggerId = triggerId

      const subscriptionData = {
        route: "some.route",
        payload: { id: 1 },
        entity: trigger.entity,
        entityId: trigger.entityId
      } as EssentialSubscriptionData

      await ctx.studioService.subscribeTrigger(triggerId, subscriptionData)
      // adjust minute interval to 10 seconds to cut test delay
      CommonLimits[CommonLimit.Minute].interval = 10
    })

    it(`should activate on first run`, async () => {

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

    it(`should not activate on next run immediately`, async () => {

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
            [BasketballEvents.Sequence]: 1
          },
        }
      ]

      for(const snapshot of snapshots) {
        const result = await processScopeSnapshot(ctx, snapshot)
        assert.equal(result, false)
      }
    })

    it(`should activate after 10 seconds interval`, async () => {

      await new Promise((resolve) => setTimeout(resolve, 10000))

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
            [BasketballEvents.Sequence]: 1
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

    it(`should send next = true in trigger notification`, async () => {
      const { trigger } = await ctx.studioService.getTrigger(ctx.triggerId)
      assert.equal(trigger.next, true)

      const [ notification ] = ctx.notifications
      ctx.log.debug({ notification }, 'trigger sent notification to subscribers')

      const { message } = notification ?? {}
      assert.notEqual(message.next, undefined)
      assert.equal(message.next, true)
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
              event: BasketballEvents.Player3FG,
              compare: CompareOp.Equal,
              targets: [ player3fg ],
            },
          ],
        },
      ]

      const triggerId = await ctx.studioService.createTrigger(triggerData, triggerConditions)
      const result = await ctx.studioService.getTrigger(triggerId)
      ctx.trigger = result.trigger
      ctx.triggerId = triggerId

      // const subscriptionData = {
      //   route: "some.route2",
      //   payload: { foo: "bar" }
      // } as EssentialSubscriptionData
      //
      // await ctx.studioService.subscribeTrigger(triggerId, subscriptionData)
    })

    it(`should send snapshot with all conditions and activate the trigger`, async () => {

      const snapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport: Sport.Basketball,
        timestamp: Date.now(),
        options: {
          [BasketballEvents.Sequence]: 1,
          [BasketballEvents.TeamShootingFoul]: homeId,
          [BasketballEvents.Team]: homeId,
          [BasketballEvents.Player3FG]: player3fg,
        },
      }

      const result = await processScopeSnapshot(ctx, snapshot)
      assert.equal(result, true)
    })
  })

  describe('check methods', function () {

    const triggers = []

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
      const trigger1 = await ctx.studioService.getTrigger(triggerId1)
      triggers.push(trigger1.trigger.id)

      const triggerId2 = await ctx.studioService.createTrigger(triggerData, triggerConditions)
      const trigger2 = await ctx.studioService.getTrigger(triggerId2)
      triggers.push(trigger2.trigger.id)

      ctx.log.debug({ trigger1, trigger2 }, `created triggers`)
    })

    it(`should create triggers`, async () => {
      assert.ok(triggers.length)
    })

    it(`should get triggers by event uris`, async () => {

      const snapshot: ScopeSnapshot = {
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

      const uris = getEventUriListBySnapshot(snapshot)
      for(const uri of uris) {
        ctx.log.debug({ uri }, `processing uri`)
        for await (const chunk of ctx.adapterService.getTriggersByUri(uri)) {
          ctx.log.debug({ chunk, uri }, `chunk loaded by generator`)
          for(const trigger of chunk) {
            assert.equal(triggers.includes(trigger.id), true)
          }
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

  describe('disabled entity', function () {

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
        disabledEntity: true
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
      ctx.triggerId = triggerId
    })

    it(`should not activate trigger in disabled entity`, async () => {

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

    it(`should enable entity`, async () => {
      await ctx.studioService.enableEntity(ctx.trigger.entity, ctx.trigger.entityId)
    })

    it(`should activate trigger in enabled entity`, async () => {

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
