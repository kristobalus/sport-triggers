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
import { Microfleet } from '@microfleet/core-types'
import { TriggerLimitCollection } from '../src/repositories/trigger-limit.collection'
import { ScopeSnapshotCollection } from '../src/repositories/scope-snapshot.collection'
import { EntityLimitCollection } from '../src/repositories/entity-limit.collection'
import { ScopeSnapshot } from '../src/models/events/scope-snapshot'
import { Sport } from '../src/models/events/sport'
import { CommonLimit } from '../src/sports/common-limits'
import { AtBatOutcomeState, BaseballEvents } from '../src/sports/baseball/baseball-events'

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

describe("Baseball from NVenue", function () {

  this.timeout(120_000)

  const datasource = "nvenue"
  const sport = Sport.Baseball
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = "question"
  const entityId = randomUUID()

  const ctx: UnitTestContext = {
    notifications: [],
  }

  before(async () => {

    ctx.redis = await initStandaloneRedis()

    const log = pino({
      name: "baseball-nvenue",
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

  describe('test baseball.atbat.outcomes for legacy string', function () {

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
          options: [
            {
              event: BaseballEvents.AtBatOutcome,
              compare: CompareOp.In,
              targets: [ AtBatOutcomeState.FO ],
            }
          ],
        }
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

    it(`should find trigger conditions`, async () => {
      assert.ok(ctx.trigger)
      assert.ok(ctx.triggerId)
      assert.ok(ctx.trigger.id)
      assert.equal(ctx.triggerId, ctx.trigger.id)
      const [ condition ] = await ctx.triggerConditionCollection.getByTriggerId(ctx.triggerId)
      assert.ok(condition)
      assert.ok(condition.options)
    })

    it(`should activate trigger for FO`, async () => {

      const scopeSnapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport,
        timestamp: Date.now(),
        options: {
          [BaseballEvents.AtBatOutcome]: AtBatOutcomeState.FO,
        },
      }

      const result = await processScopeSnapshot(ctx, scopeSnapshot)
      assert.equal(result, true)
    })
  })

  describe('test baseball.atbat.outcomes for string list value', function () {

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
          options: [
            {
              event: BaseballEvents.AtBatOutcome,
              compare: CompareOp.In,
              targets: [ AtBatOutcomeState.FO ],
            }
          ],
        }
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

    it(`should find trigger conditions`, async () => {
      assert.ok(ctx.trigger)
      assert.ok(ctx.triggerId)
      assert.ok(ctx.trigger.id)
      assert.equal(ctx.triggerId, ctx.trigger.id)
      const [ condition ] = await ctx.triggerConditionCollection.getByTriggerId(ctx.triggerId)
      assert.ok(condition)
      assert.ok(condition.options)
    })

    it(`should activate trigger for FO,IPO,OUT`, async () => {

      const scopeSnapshot: ScopeSnapshot = {
        id: randomUUID(),
        datasource,
        scope,
        scopeId,
        sport,
        timestamp: Date.now(),
        options: {
          [BaseballEvents.AtBatOutcome]: `${AtBatOutcomeState.FO},${AtBatOutcomeState.IPO},${AtBatOutcomeState.OUT}`,
        },
      }

      const result = await processScopeSnapshot(ctx, scopeSnapshot)
      assert.equal(result, true)
    })
  })


})
