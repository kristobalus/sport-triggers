import { CoreOptions } from "@microfleet/core-types"

import * as assert from "assert"
import { randomUUID } from "crypto"

import { TestContext } from "../module"
import { Scope } from "../../src/models/entities/trigger"
import { ListResponse, ItemResponse } from "../../src/models/dto/response"
import { startContext, stopContext } from "../helpers/common"
import { FootballEvents } from "../../src/models/events/football/football-events"
import { CompareOp } from "../../src/models/entities/trigger-condition"
import {
  EssentialConditionData,
  EssentialTriggerData,
  TriggerCreateRequest,
} from "../../src/models/dto/trigger-create-request"
import { GameLevel } from "../../src/models/events/football/football-game-level.event"
import { TriggerListRequest } from "../../src/models/dto/trigger-list-request"
import { TriggerCreateResponse } from "../../src/models/dto/trigger-create-response"
import { TriggerSubscribeRequest } from "../../src/models/dto/trigger-subscribe-request"
import { TriggerSubscription } from "../../src/models/entities/trigger-subscription"
import { SubscriptionListRequest } from "../../src/models/dto/subscription-list-request"

interface SuitContext extends TestContext {
  triggerId?: string
  subscriptionId?: string
}

describe(`Condition params test`, function () {

  const scope = Scope.SportradarGames
  const scopeId = randomUUID()

  // trigger-related entity
  const entity = "moderation"
  // trigger-related entity id
  const entityId = randomUUID()

  // subscription-related entity
  const subscribedEntity = "question"
  // subscription-related entity id
  const subscribedEntityId = "1"

  const ctx: SuitContext = {}

  before(async () => {
    await startContext(ctx, {
      logger: {
        debug: true,
        options: {
          level: "trace",
        },
      },
    } as Partial<CoreOptions>)
  })

  after(async () => {
    await stopContext(ctx)
  })

  it(`should create trigger for player events`, async () => {
    const triggerData = {
      name: "...",
      description: "..",
      scope,
      scopeId,
      entity,
      entityId,
    } as EssentialTriggerData

    const conditionData = [
      {
        event: FootballEvents.GameLevel,
        compare: CompareOp.Equal,
        target: GameLevel.Start
      },
    ] as EssentialConditionData[]

    const prefix = ctx.service.config.routerAmqp.prefix

    const response: ItemResponse<TriggerCreateResponse> = await ctx.service.amqp.publishAndWait(`${prefix}.studio.trigger.create`, {
      trigger: triggerData,
      conditions: conditionData,
    } as TriggerCreateRequest)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.id)
    assert.ok(response.data.type)
    assert.equal(response.data.type, "trigger")

    ctx.triggerId = response.data.id
  })

  it(`should list triggers`, async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const response: ListResponse = await ctx.service.amqp.publishAndWait(`${prefix}.studio.trigger.list`,
      { entity, entityId } as TriggerListRequest)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.length)
    assert.equal(response.data.length, 1)

    const [item] = response.data

    assert.ok(item.type)
    assert.equal(item.type, "trigger")
  })

  it(`should subscribe for trigger`, async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const response: ItemResponse = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.trigger.subscribe`,
        {
          triggerId: ctx.triggerId, subscription: {
            route: "interactive.question.activate",
            payload: { foo: "bar", id: "1" },
            entity: subscribedEntity,
            entityId: subscribedEntityId,
          },
        } as TriggerSubscribeRequest)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.id)
    assert.ok(response.data.type)
    assert.equal(response.data.type, "subscription")

    ctx.subscriptionId = response.data.id
  })

  it(`should get subscription list by trigger`, async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const response: ListResponse<TriggerSubscription> = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.subscription.list`, { triggerId: ctx.triggerId })

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.length)

    const [item] = response.data

    assert.equal(item.attributes.id, ctx.subscriptionId)
  })

  it(`should get subscription list by entity`, async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const response: ListResponse<TriggerSubscription> = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.subscription.list`,
        { entity: subscribedEntity, entityId: subscribedEntityId  } as SubscriptionListRequest)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.length)

    const [item] = response.data

    assert.ok(item.type)
    assert.ok(item.id)
    assert.equal(item.type, "subscription")
    assert.equal(item.id, ctx.subscriptionId)
    assert.equal(item.attributes.id, ctx.subscriptionId)
  })

  it(`should cancel subscription`, async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const response: ItemResponse = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.subscription.cancel`, { id: ctx.subscriptionId })

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.id)
    assert.equal(response.data.id, ctx.subscriptionId)
  })

  it(`should delete trigger`, async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const response: ItemResponse = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.trigger.delete`, { id: ctx.triggerId })

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.id)
    assert.ok(response.data.type)
    assert.equal(response.data.type, "trigger")
    assert.equal(response.data.id, ctx.triggerId)
  })
})
