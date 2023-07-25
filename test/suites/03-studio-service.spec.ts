import { CoreOptions } from '@microfleet/core-types'

import * as assert from 'assert'
import { randomUUID } from 'crypto'

import { TestContext } from '../module'
import { Scope } from '../../src/models/entities/trigger'
import { ListResponse, ItemResponse } from '../../src/models/dto/response'
import { startContext, stopContext } from '../helpers/common'
import { FootballEvents } from '../../src/configs/studio/football/football-events'
import { CompareOp } from '../../src/models/entities/trigger-condition'
import {
  EssentialConditionData,
  EssentialTriggerData,
  TriggerCreateRequest
} from '../../src/models/dto/trigger-create-request'
import { GameLevel } from '../../src/configs/studio/football/game-level'
import { TriggerListRequest } from '../../src/models/dto/trigger-list-request'
import { TriggerCreateResponse } from '../../src/models/dto/trigger-create-response'
import { TriggerSubscribeRequest } from '../../src/models/dto/trigger-subscribe-request'
import { TriggerSubscription } from '../../src/models/entities/trigger-subscription'
import { SubscriptionListRequest } from '../../src/models/dto/subscription-list-request'
import { TriggerGetRequest } from '../../src/models/dto/trigger-get-request'
import { TriggerWithConditions } from '../../src/models/dto/trigger-with-conditions'
import { SubscriptionCancelRequest } from "../../src/models/dto/subscription-cancel-request"
import { TriggerDeleteRequest } from "../../src/models/dto/trigger-delete-request"


const sinon = require('sinon');

interface SuitContext extends TestContext {
  triggerId?: string
  subscriptionId?: string
}

describe('StudioService', function () {

  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = 'moderation'
  const entityId = randomUUID()
  const subEntity = 'question'
  const subEntityId = randomUUID()

  const ctx: SuitContext = {}

  before(async () => {

    await startContext(ctx, {
      logger: {
        debug: true,
        options: {
          level: 'trace',
        },
      },
    } as Partial<CoreOptions>)

    const amqpService = ctx.service.amqp;
    const stub = sinon.stub(amqpService, 'publishAndWait');
    stub.withArgs('sports.events.retrieveProviderId').resolves({ providerId: "0d996d35-85e5-4913-bd45-ac9cfedbf272" });
    stub.callThrough();
  })

  after(async () => {
    await stopContext(ctx)
  })

  it('should create trigger', async () => {

    const triggerData: EssentialTriggerData = {
      name: '...',
      description: '..',
      datasource,
      scope,
      scopeId,
      entity,
      entityId,
    }

    const conditionData: EssentialConditionData[] = [
      {
        event: FootballEvents.GameLevel,
        compare: CompareOp.Equal,
        targets: [ GameLevel.Start ],
        options: []
      },
    ]

    const prefix = ctx.service.config.routerAmqp.prefix

    const data: TriggerCreateRequest = {
      trigger: triggerData,
      conditions: conditionData,
    }

    const response: ItemResponse<TriggerCreateResponse> = await ctx.service
      .amqp.publishAndWait(`${prefix}.studio.trigger.create`, data)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.id)
    assert.ok(response.data.type)
    assert.equal(response.data.type, 'trigger')

    ctx.triggerId = response.data.id
  })

  it('should get trigger by id', async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const response: ItemResponse<TriggerWithConditions> =
      await ctx.service.amqp.publishAndWait(`${prefix}.studio.trigger.get`,
        { id: ctx.triggerId } as TriggerGetRequest)

    assert.ok(response)
    assert.ok(response.data)

    const item = response.data

    assert.ok(item.type)
    assert.equal(item.type, 'trigger')
  })

  it('should list triggers by entity', async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const response: ListResponse = await ctx.service
      .amqp.publishAndWait(`${prefix}.studio.trigger.list`, { entity, entityId } as TriggerListRequest)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.length)
    assert.equal(response.data.length, 1)

    const [item] = response.data

    assert.ok(item.type)
    assert.equal(item.type, 'trigger')
  })

  it('should subscribe for trigger', async () => {
    const prefix = ctx.service.config.routerAmqp.prefix

    const data: TriggerSubscribeRequest = {
      triggerId: ctx.triggerId, subscription: {
        route: 'interactive.question.activate',
        payload: { foo: 'bar', id: '1' },
        entity: subEntity,
        entityId: subEntityId,
      }
    }

    const response: ItemResponse = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.trigger.subscribe`, data)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.id)
    assert.ok(response.data.type)
    assert.equal(response.data.type, 'subscription')

    ctx.subscriptionId = response.data.id
  })

  it('should get subscription list by trigger', async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const data = { triggerId: ctx.triggerId } as SubscriptionListRequest

    const response: ListResponse<TriggerSubscription> = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.subscription.list`, data)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.length)

    const [item] = response.data

    assert.equal(item.attributes.id, ctx.subscriptionId)
  })

  it('should get subscription list by entity', async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const data = { entity: subEntity, entityId: subEntityId  } as SubscriptionListRequest
    const response: ListResponse<TriggerSubscription> = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.subscription.list`, data)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.length)

    const [ found ] = response.data.filter(item => item.id == ctx.subscriptionId)

    assert.ok(found)
    assert.ok(found.type)
    assert.ok(found.id)
    assert.equal(found.type, 'subscription')
    assert.equal(found.id, ctx.subscriptionId)
    assert.equal(found.attributes.id, ctx.subscriptionId)
  })

  it('should cancel subscription', async () => {

    const prefix = ctx.service.config.routerAmqp.prefix
    const data = { id: ctx.subscriptionId } as SubscriptionCancelRequest

    const response: ItemResponse = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.subscription.cancel`, data)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.id)
    assert.equal(response.data.id, ctx.subscriptionId)
  })

  it('should delete trigger', async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const data = { id: ctx.triggerId } as TriggerDeleteRequest

    const response: ItemResponse = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.trigger.delete`, data)

    assert.ok(response)
    assert.ok(response.data)
    assert.ok(response.data.id)
    assert.ok(response.data.type)
    assert.equal(response.data.type, 'trigger')
    assert.equal(response.data.id, ctx.triggerId)
  })

  it('should get metadata', async () => {
    const prefix = ctx.service.config.routerAmqp.prefix
    const data = { eventId: "123", sport: "basketball" }
    const response: ItemResponse = await ctx.service.amqp
      .publishAndWait(`${prefix}.studio.metadata.get`, data)
    console.log(response)
  })

})
