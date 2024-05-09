// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import assert from 'assert'
import IORedis, { Redis } from 'ioredis'
import pino, { Logger } from 'pino'
import pretty from 'pino-pretty'

import { StudioService, StudioServiceOptions } from '../src/services/studio/studio.service'
import { EssentialConditionData, EssentialTriggerData } from '../src/models/dto/trigger-create-request'
import { CompareOp, ConditionType } from '../src/models/entities/trigger-condition'
import { TriggerCollection } from '../src/repositories/trigger.collection'
import { TriggerConditionCollection } from '../src/repositories/trigger-condition.collection'
import { randomUUID } from 'crypto'
import { TriggerSubscriptionCollection } from '../src/repositories/trigger-subscription.collection'
import { Scope } from '../src/models/entities/trigger'
import { EssentialSubscriptionData } from '../src/models/dto/trigger-subscribe-request'
import { BasketballEvents } from '../src/sports/basketball/basketball-events'
import { Microfleet } from '@microfleet/core-types'
import { TriggerLimitCollection } from '../src/repositories/trigger-limit.collection'
import { EntityLimitCollection } from '../src/repositories/entity-limit.collection'
import { Sport }  from "../src/models/events/sport"
import { CommonLimit } from '../src/sports/common-limits'

interface TestContext {
  log?: Logger
  redis?: Redis
  triggerId?: string
  studioService?: StudioService
  triggerCollection?: TriggerCollection
  conditionCollection?: TriggerConditionCollection
  subscriptionCollection?: TriggerSubscriptionCollection
  triggerLimitCollection?: TriggerLimitCollection
  entityLimitCollection?: EntityLimitCollection
}

describe('StudioService', function () {

  const sport = Sport.Basketball
  const scope = Scope.Game
  const scopeId = randomUUID()
  const datasource = 'sportradar'
  const entity = 'moderation'
  const entityId = randomUUID()
  const teamId = randomUUID()
  const ctx: TestContext = {}

  before(async () => {
    ctx.redis = new IORedis()
    await ctx.redis.flushall()

    const log = pino({
      name: 'StudioService',
      level: 'debug',
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: 'time,hostname,pid',
    }))

    ctx.triggerCollection = new TriggerCollection(ctx.redis)
    ctx.conditionCollection = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptionCollection = new TriggerSubscriptionCollection(ctx.redis)
    ctx.triggerLimitCollection = new TriggerLimitCollection(ctx.redis)
    ctx.entityLimitCollection = new EntityLimitCollection(ctx.redis)

    ctx.studioService = new StudioService({
      log: log as Microfleet['log'],
      redis: ctx.redis,
      triggerCollection: ctx.triggerCollection,
      conditionCollection: ctx.conditionCollection,
      subscriptionCollection: ctx.subscriptionCollection,
      triggerLimitCollection: ctx.triggerLimitCollection,
      entityLimitCollection: ctx.entityLimitCollection,
      defaultLimits: {
        [CommonLimit.Scope]: 10
      }
    } as StudioServiceOptions)
    ctx.log = log
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`should create trigger with limits`, async () => {

    const triggerData: EssentialTriggerData = {
      name: 'Trigger name',
      description: 'Trigger Description',
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
            event: BasketballEvents.TeamScoresPoints,
            compare: CompareOp.GreaterOrEqual,
            targets: ['20'],
          },
        ],
      },
    ]

    const givenLimits = {
      [CommonLimit.Scope]: 1
    }

    ctx.triggerId = await ctx.studioService.createTrigger(triggerData, conditionData, givenLimits)
    assert.ok(ctx.triggerId)

    const [condition] = await ctx.conditionCollection.getByTriggerId(ctx.triggerId)
    const storedLimits = await ctx.triggerLimitCollection.getLimits(ctx.triggerId)

    assert.equal(condition.event, BasketballEvents.Team)
    assert.equal(condition.type, ConditionType.String)
    assert.equal(condition.compare, CompareOp.In)
    assert.deepEqual(condition.targets, [teamId])
    assert.deepEqual(givenLimits, storedLimits)
  })

  it(`should find list of triggers by scope`, async () => {
    const list = await ctx.triggerCollection.getListByScope(datasource, scope, scopeId)
    assert.ok(list)
    assert.equal(list.length > 0, true)
  })

  it(`should be able to find trigger by event and scope`, async () => {
    const triggers = await ctx.conditionCollection
      .getTriggerListByScopeAndEventName(datasource, scope, scopeId, BasketballEvents.Team)
    assert.equal(triggers.length, 1)
    assert.equal(triggers.indexOf(ctx.triggerId), 0)
  })

  it(`studio should create subscription for trigger`, async () => {

    const data: EssentialSubscriptionData = {
      entity: "question",
      entityId: "1",
      route: 'some.route',
      payload: { foo: 'bar' },
    }

    const id = await ctx.studioService.subscribeTrigger(ctx.triggerId, data)

    const subscription = await ctx.subscriptionCollection.getOne(id)

    assert.ok(subscription)
    assert.ok(subscription.route)
    assert.ok(subscription.payload)
    assert.equal(subscription.route, data.route)
  })

  it(`studio should get trigger by id`, async () => {
    const trigger = await ctx.studioService.getTrigger(ctx.triggerId, { showLog: false, trim: true })
    assert.ok(trigger.trigger.name, 'Trigger')
    assert.ok(trigger.trigger.name, 'Trigger Description')
    ctx.log.debug({ trigger }, 'trigger by id')
  })

  it(`studio should update trigger`, async () => {
    const document = await ctx.studioService.getTrigger(ctx.triggerId, { showLog: false, trim: true })
    assert.ok(document.trigger.name, 'Trigger')
    assert.ok(document.trigger.name, 'Trigger Description')
    ctx.log.debug({ triggerOriginal: document }, 'trigger by id')

    document.trigger.name = 'Trigger Updated'
    await ctx.studioService.updateTrigger(document.trigger, document.conditions)

    const documentUpdated = await ctx.studioService.getTrigger(ctx.triggerId, { showLog: false, trim: true })
    ctx.log.debug({ triggerUpdated: documentUpdated }, 'trigger by id')
    assert.ok(documentUpdated.trigger.name, 'Trigger Updated')
  })

  it(`parent field in options`, async () => {
    const triggerData = {
      name: "Trigger for inningNumber 7",
      description: "This trigger is a great tool to capture game event. Quick brown fox jumps over the gate.",
      datasource: "nvenue",
      scope: "game",
      scopeId: "2fd8607e-b598-4301-9b0d-48f82ff60829",
      entity: "question",
      sport: "baseball",
      entityId: "69048",
      useLimits: true
    } as EssentialTriggerData

    const conditionData = [
      {
        options: [
          {
            event: "baseball.atbat.outcomes",
            compare: "in",
            targets: ["B1"],
            parent: "baseball.team.batter"
          },
          {
            event: "baseball.team.batter",
            compare: "in",
            targets: ["NYY"]
          },
          {
            event: "baseball.inningNumber",
            compare: "eq",
            targets: [ "7" ]
          }
        ]
      }
    ] as EssentialConditionData[]

    const limits = {
      scope: 100,
      minute: 1
    }

    const response = await ctx.studioService.createTrigger(triggerData, conditionData, limits)

    ctx.log.debug({ response }, 'trigger created')
  })

  after(async () => {
    await new Promise(h => setTimeout(h, 1000))
  })

})
