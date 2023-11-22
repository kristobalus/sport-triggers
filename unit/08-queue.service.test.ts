// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import { Redis, RedisOptions } from 'ioredis'
import pino from 'pino'
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
import { QueueService } from '../src/services/queue/queue.service'
import { ScopeSnapshot } from '../src/models/events/scope-snapshot'
import { Defer } from '../src/utils/defer'
import { Microfleet } from '@microfleet/core-types'
import { TriggerLimitCollection } from '../src/repositories/trigger-limit.collection'
import { EntityLimitCollection } from '../src/repositories/entity-limit.collection'
import { ScopeSnapshotCollection } from '../src/repositories/scope-snapshot.collection'
import { Sport } from '../src/models/events/sport'
import { BasketballEvents } from '../src/sports/basketball/basketball-events'
import assert from "assert"

describe("QueueService", function () {

  const sport = Sport.Basketball
  const scope = Scope.Game
  const scopeId = randomUUID()
  const datasource = "sportradar"
  const entity = "moderation"
  const entityId = randomUUID()
  const homeId = randomUUID()

  const ctx: {
    log?: Microfleet['log'],
    redis?: Redis
    redisOptions?: RedisOptions
    adapter?: AdapterService
    studio?: StudioService
    queueService?: QueueService
    triggerCollection?: TriggerCollection
    triggerConditionCollection?: TriggerConditionCollection
    triggerSubscriptionCollection?: TriggerSubscriptionCollection
    triggerLimitCollection?: TriggerLimitCollection
    entityLimitCollection?: EntityLimitCollection
    snapshotCollection?: ScopeSnapshotCollection
    notifications: any[]
    receiver?: EssentialSubscriptionData
    deferred?: Defer
    trigger?: Trigger
    triggerId?: string
  } = {
    notifications: [],
  }

  before(async () => {

    ctx.redisOptions = { keyPrefix: "{triggers}" }
    ctx.redis = await initStandaloneRedis(ctx.redisOptions)

    await ctx.redis.flushall()

    ctx.receiver = {
      route: 'trigger.receiver',
      payload: { id: 1 },
      entity: 'question',
      entityId: '50',
      options: {},
    }

    const log = pino({
      name: "test",
      level: "trace",
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    }))

    const amqp = {
      async publish<T = any>(route: string, message: any, options?: Publish): Promise<T> {
        ctx.notifications.push({ route, message, options })
        log.debug({ notification: { route, message, options } }, 'notification received')
        return {} as T
      },
    } as AMQPTransport

    ctx.log = log as Microfleet['log']
    ctx.triggerCollection = new TriggerCollection(ctx.redis)
    ctx.triggerConditionCollection = new TriggerConditionCollection(ctx.redis)
    ctx.triggerSubscriptionCollection = new TriggerSubscriptionCollection(ctx.redis)
    ctx.triggerLimitCollection = new TriggerLimitCollection(ctx.redis)
    ctx.entityLimitCollection = new EntityLimitCollection(ctx.redis)
    ctx.snapshotCollection = new ScopeSnapshotCollection(ctx.redis)
    ctx.notifications = []

    ctx.adapter = new AdapterService({
      log: log,
      redis: ctx.redis,
      amqp: amqp,
      triggerCollection: ctx.triggerCollection,
      triggerLimitCollection: ctx.triggerLimitCollection,
      conditionCollection: ctx.triggerConditionCollection,
      subscriptionCollection: ctx.triggerSubscriptionCollection,
      scopeSnapshotCollection: ctx.snapshotCollection,
      entityLimitCollection: ctx.entityLimitCollection
    } as AdapterServiceOptions)

    ctx.studio = new StudioService({ log,
      redis: ctx.redis,
      triggerCollection: ctx.triggerCollection,
      triggerLimitCollection: ctx.triggerLimitCollection,
      conditionCollection: ctx.triggerConditionCollection,
      subscriptionCollection: ctx.triggerSubscriptionCollection
    } as StudioServiceOptions)

    ctx.queueService = new QueueService(log as Microfleet['log'], ctx.adapter, {})

    const triggerData: EssentialTriggerData = {
      name: "...",
      description: "...",
      datasource,
      sport,
      scope,
      scopeId,
      entity,
      entityId
    }

    const conditionData: EssentialConditionData[] = [
      {
        event: BasketballEvents.Team,
        compare: CompareOp.In,
        targets: [ homeId ],
        options: [
          {
            event: BasketballEvents.TeamScoresPoints,
            targets: [ "30" ],
            compare: CompareOp.In
          },
          {
            event: BasketballEvents.Sequence,
            targets: [ "1" ],
            compare: CompareOp.In
          }
        ]
      }
    ]

    const triggerId = await ctx.studio.createTrigger(triggerData, conditionData)

    const { trigger } = await ctx.studio.getTrigger(triggerId)
    ctx.trigger = trigger
    ctx.triggerId = triggerId
    ctx.notifications = []

    const subscriptionData = {
      ...ctx.receiver,
    } as EssentialSubscriptionData

    await ctx.studio.subscribeTrigger(triggerId, subscriptionData)
  })

  // after(async () => {
  //   ctx.redis.disconnect()
  //   await ctx.queueService.close()
  // })

  it(`should store scope snapshot, generate event snapshots and do trigger evaluation`, async () => {

    const snapshot: ScopeSnapshot = {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.Sequence]: "1",
        [BasketballEvents.Team]: homeId,
        [BasketballEvents.GamePointsHome]: "30"
      }
    }

    const storeSnapshotJobDeferred = new Defer<any>()
    ctx.queueService.storeJobCallback = (result) => {
      storeSnapshotJobDeferred.resolve(result)
    }

    const triggerJobDeferred = new Defer<any>()
    ctx.queueService.triggerJobCallback = (result) => {
      triggerJobDeferred.resolve(result)
    }

    await ctx.queueService.addScopeSnapshot(snapshot)

    const storeJobResult = await storeSnapshotJobDeferred.promise
    ctx.log.debug(storeJobResult, `store scope snapshot job result`)

    const triggerJobResult = await triggerJobDeferred.promise
    ctx.log.debug(triggerJobResult, `trigger job result`)

    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  it(`should notify after trigger activation`, async () => {

    const snapshot: ScopeSnapshot = {
      id: randomUUID(),
      datasource,
      sport,
      scope,
      scopeId,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.Team]: homeId,
        [BasketballEvents.TeamScoresPoints]: "30",
        [BasketballEvents.Sequence]: "1"
      }
    }

    const storeJobDeferred = new Defer<any>()
    const triggerJobDeferred = new Defer<any>()
    const notificationJobDeferred = new Defer<any>()

    ctx.queueService.storeJobCallback = (result) => {
      storeJobDeferred.resolve(result)
    }

    ctx.queueService.triggerJobCallback = (result) => {
      triggerJobDeferred.resolve(result)
    }

    ctx.queueService.notificationJobCallback = (result) => {
      notificationJobDeferred.resolve(result)
    }

    await ctx.queueService.addScopeSnapshot(snapshot)
    const storeJobResult = await storeJobDeferred.promise
    ctx.log.debug(storeJobResult, `store job result`)

    const triggerJobResult = await triggerJobDeferred.promise
    ctx.log.debug(triggerJobResult, `trigger job result`)
    // assert.equal(triggerJobResult.triggerActivated, true)

    const notificationJobResult = await notificationJobDeferred.promise

    ctx.log.debug(notificationJobResult, `notification job result`)
    assert.equal(notificationJobResult.result, true)
  })

  after(async () => {
    await ctx.queueService.close()
    ctx.redis.disconnect()
  })


})
