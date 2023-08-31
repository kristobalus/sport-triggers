// start local redis instance (dir helper) to start test from IDE, faster than full integration tests via mdep

import assert from "assert"
import IORedis, { Redis } from "ioredis"
import pino, { Logger } from "pino"
import pretty from "pino-pretty"

import { StudioService } from "../src/services/studio/studio.service"
import { EssentialConditionData, EssentialTriggerData } from "../src/models/dto/trigger-create-request"
import { CompareOp, ConditionType } from "../src/models/entities/trigger-condition"
import { TriggerCollection } from "../src/repositories/trigger.collection"
import { TriggerConditionCollection } from "../src/repositories/trigger-condition.collection"
import { randomUUID } from "crypto"
import { TriggerSubscriptionCollection } from "../src/repositories/trigger-subscription.collection"
import { Scope } from "../src/models/entities/trigger"
import { EssentialSubscriptionData } from "../src/models/dto/trigger-subscribe-request"
import { BasketballEvents } from "../src/sports/basketball/basketball-events"
import { Microfleet } from "@microfleet/core-types"

describe("StudioService", function () {

  const scope = Scope.Game
  const scopeId = randomUUID()
  const datasource = "sportradar"
  const entity = "moderation"
  const entityId = randomUUID()
  const teamId = randomUUID()

  const ctx: {
    log?: Logger,
    redis?: Redis,
    triggerId?: string
    service?: StudioService
    triggers?: TriggerCollection
    conditions?: TriggerConditionCollection,
    subscriptions?: TriggerSubscriptionCollection
  } = {}

  before(async () => {
    ctx.redis = new IORedis()
    await ctx.redis.flushall()

    const log = pino({
      name: "StudioService",
      level: "debug"
    }, pretty({
      levelFirst: true,
      colorize: true,
      ignore: "time,hostname,pid",
    }))

    ctx.triggers = new TriggerCollection(ctx.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.redis)
    ctx.subscriptions = new TriggerSubscriptionCollection(ctx.redis)
    ctx.service = new StudioService(log as Microfleet['log'], ctx.redis)
    ctx.log = log
  })

  after(async () => {
    ctx.redis.disconnect()
  })

  it(`should create trigger`, async () => {

    const triggerData: EssentialTriggerData = {
      name: "Trigger name",
      description: "Trigger Description",
      datasource,
      scope,
      scopeId,
      entity,
      entityId
    }

    const conditionData: EssentialConditionData[] = [
      {
        event: BasketballEvents.Team,
        compare: CompareOp.In,
        targets: [ teamId ],
        options: [
          {
            event: BasketballEvents.TeamScoresPoints,
            compare: CompareOp.GreaterOrEqual,
            targets: [ "20" ]
          }
        ]
      }
    ]

    ctx.triggerId = await ctx.service.createTrigger(triggerData, conditionData)
    assert.ok(ctx.triggerId)

    const [ condition ] = await ctx.conditions.getByTriggerId(ctx.triggerId)

    assert.equal(condition.event, BasketballEvents.Team)
    assert.equal(condition.type, ConditionType.String)
    assert.equal(condition.compare, CompareOp.In)
    assert.deepEqual(condition.targets, [ teamId ])
  })

  it(`should find list of triggers by scope`, async () => {
    const [ id ] = await ctx.triggers.getListByScope(datasource, scope, scopeId)
    assert.ok(id)
    assert.equal(ctx.triggerId, id)
  })

  it(`should be able to find trigger by event and scope`, async () => {
    const triggers = await ctx.conditions
      .getTriggerListByScopeAndEventName(datasource, scope, scopeId, BasketballEvents.Team)
    assert.equal(triggers.length, 1)
    assert.equal(triggers.indexOf(ctx.triggerId), 0)
  })

  it(`studio should create subscription for trigger`, async () => {

    const data: EssentialSubscriptionData = {
      route: "some.route",
      payload: { foo: "bar" }
    }

    const id = await ctx.service.subscribeTrigger(ctx.triggerId, data)

    const subscription = await ctx.subscriptions.getOne(id)

    assert.ok(subscription)
    assert.ok(subscription.route)
    assert.ok(subscription.payload)
    assert.equal(subscription.route, data.route)
  })

  it(`studio should get trigger by id`, async () => {
    const trigger = await ctx.service.getTrigger(ctx.triggerId, { showLog: true, trim: true })
    assert.ok(trigger.trigger.name, "Trigger")
    assert.ok(trigger.trigger.name, "Trigger Description")
    ctx.log.debug({ trigger }, 'trigger by id')
  })

  it(`studio should update trigger`, async () => {
    const document = await ctx.service.getTrigger(ctx.triggerId, { showLog: true, trim: true })
    assert.ok(document.trigger.name, "Trigger")
    assert.ok(document.trigger.name, "Trigger Description")
    ctx.log.debug({ triggerOriginal: document }, 'trigger by id')

    document.trigger.name = "Trigger Updated"
    await ctx.service.updateTrigger(document.trigger, document.conditions)

    const documentUpdated = await ctx.service.getTrigger(ctx.triggerId, { showLog: true, trim: true })
    ctx.log.debug({ triggerUpdated: documentUpdated }, 'trigger by id')
    assert.ok(documentUpdated.trigger.name, "Trigger Updated")
  })

  after(async () => {
    await new Promise(h => setTimeout(h, 1000))
  })


})
