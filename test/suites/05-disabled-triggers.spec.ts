import { CoreOptions } from '@microfleet/core-types'

import { randomUUID } from 'crypto'
import assert = require('assert')

import { TestContext } from '../module'
import { Scope, Trigger } from '../../src/models/entities/trigger'
import { startContext, stopContext } from '../helpers/common'
import { ChainOp, CompareOp } from '../../src/models/entities/trigger-condition'
import {
  EssentialConditionData,
  EssentialTriggerData,
  TriggerCreateRequest,
} from '../../src/models/dto/trigger-create-request'
import { GameLevel } from '../../src/sports/basketball/game-level'
import { TriggerSubscribeRequest } from '../../src/models/dto/trigger-subscribe-request'
import { ItemResponse } from '../../src/models/dto/response'
import { TriggerCreateResponse } from '../../src/models/dto/trigger-create-response'
import { TriggerWithConditions } from '../../src/models/dto/trigger-with-conditions'
import { TriggerGetRequest } from '../../src/models/dto/trigger-get-request'
import { Defer } from '../../src/utils/defer'
import { BasketballEvents } from '../../src/sports/basketball/basketball-events'
import { TriggerDisableRequest } from '../../src/models/dto/trigger-disable-request'

interface SuiteContext extends TestContext {
  amqpPrefix?: string
  triggerId?: string
  trigger?: Trigger
  subscriptionId?: string
  consumer?: any
  pendingSubscriberMessage?: Defer<any>
  receiver?: {
    route: string
    payload: object
    entity: string
    entityId: string
  }
}

describe('Disabled triggers', function () {
  const datasource = 'sportradar'
  const scope = Scope.Game
  const scopeId = '0d996d35-85e5-4913-bd45-ac9cfedbf272'
  const entity = 'moderation'
  const entityId = randomUUID()

  const teamId = randomUUID()
  const teamPoints = '30'

  const ctx: SuiteContext = {
    receiver: {
      route: 'trigger.receiver',
      payload: { id: 1 },
      entity: 'question',
      entityId: '1',
    },
  }

  async function createTrigger(ctx: SuiteContext) {
    const { amqpPrefix } = ctx

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
        event: BasketballEvents.GameLevel,
        compare: CompareOp.Equal,
        targets: [
          GameLevel.Start,
        ],
        options: [],
      },
      {
        event: BasketballEvents.Team,
        compare: CompareOp.In,
        targets: [teamId],
        chainOperation: ChainOp.AND,
        options: [
          {
            event: BasketballEvents.TeamScoresPoints,
            compare: CompareOp.Equal,
            targets: [teamPoints],
          },
        ],
      },
      {
        event: BasketballEvents.Team,
        compare: CompareOp.In,
        targets: [
          teamId,
        ],
        chainOperation: ChainOp.AND,
        options: [
          {
            event: BasketballEvents.TeamShootingFoul,
          },
        ],
      },
    ]

    const response: ItemResponse<TriggerCreateResponse> =
      await ctx.app.amqp.publishAndWait(`${amqpPrefix}.studio.trigger.create`, {
        trigger: triggerData,
        conditions: conditionData,
      } as TriggerCreateRequest)

    ctx.triggerId = response.data.id

    const { trigger } = await getTriggerWithConditions(ctx.triggerId)

    ctx.trigger = trigger
  }

  async function createSubscription(ctx: SuiteContext) {
    const { amqpPrefix } = ctx

    const response: ItemResponse = await ctx.app.amqp
      .publishAndWait(`${amqpPrefix}.studio.trigger.subscribe`, {
        triggerId: ctx.triggerId,
        subscription: {
          route: ctx.receiver.route,
          payload: ctx.receiver.payload,
          entity: ctx.receiver.entity,
          entityId: ctx.receiver.entityId,
        },
      } as TriggerSubscribeRequest)

    ctx.subscriptionId = response.data.id
  }

  async function createConsumer(ctx: SuiteContext) {
    const { amqp } = ctx.app

    await amqp.createConsumedQueue((message) => {
      ctx.app.log.debug({ message }, 'queue received a message')
      ctx.pendingSubscriberMessage?.resolve(message)
    }, [ctx.receiver.route], { queue: 'service', noAck: true })

    ctx.pendingSubscriberMessage = new Defer<any>()
  }

  async function getTriggerWithConditions(triggerId: string): Promise<TriggerWithConditions> {
    const response: ItemResponse<TriggerWithConditions> =
      await ctx.app.amqp.publishAndWait(`${ctx.amqpPrefix}.studio.trigger.get`,
        { id: triggerId } as TriggerGetRequest)

    const item = response.data

    return item.attributes
  }

  async function disableTrigger(ctx: SuiteContext) {
    const { amqpPrefix } = ctx

    await ctx.app.amqp.publishAndWait(`${amqpPrefix}.studio.trigger.disable`, {
      id: ctx.triggerId
    } as TriggerDisableRequest)
  }

  async function disableEntity(ctx: SuiteContext) {
    const { amqpPrefix } = ctx

    await ctx.app.amqp.publishAndWait(`${amqpPrefix}.studio.entity.disable`, {
      entities: [
        {
          entity: ctx.trigger.entity,
          entityId: ctx.trigger.entityId
        }
      ]
    })
  }

  async function enableTrigger(ctx: SuiteContext) {
    const { amqpPrefix } = ctx

    await ctx.app.amqp.publishAndWait(`${amqpPrefix}.studio.trigger.enable`, {
      id: ctx.triggerId
    } as TriggerDisableRequest)
  }

  async function enableEntity(ctx: SuiteContext) {
    const { amqpPrefix } = ctx

    await ctx.app.amqp.publishAndWait(`${amqpPrefix}.studio.entity.enable`, {
      entities: [
        {
          entity: ctx.trigger.entity,
          entityId: ctx.trigger.entityId
        }
      ]
    })
  }

  before(async () => {
    await startContext(ctx, {
      logger: {
        debug: true,
        prettifyDefaultLogger: true,
        options: {
          level: 'debug',
        },
      },
    } as Partial<CoreOptions>)

    ctx.amqpPrefix = ctx.app.config.routerAmqp.prefix

    await createConsumer(ctx)
    await createTrigger(ctx)
    await createSubscription(ctx)
  })

  after(async () => {
    await stopContext(ctx)
  })

  it('should disable trigger', async () => {
    await disableTrigger(ctx)
    const { trigger } = await getTriggerWithConditions(ctx.triggerId)

    ctx.app.log.debug({ trigger }, 'trigger status')
    assert.equal(trigger.disabled, true)
  })

  it('should disable entity', async () => {
    await disableEntity(ctx)
    const { trigger } = await getTriggerWithConditions(ctx.triggerId)

    ctx.app.log.debug({ trigger }, 'trigger status')
    assert.equal(trigger.disabledEntity, true)
  })

  it('should enable trigger', async () => {
    await enableTrigger(ctx)
    const { trigger } = await getTriggerWithConditions(ctx.triggerId)

    ctx.app.log.debug({ trigger }, 'trigger status')
    assert.equal(trigger.disabled, false)
  })

  it('should enable entity', async () => {
    await enableEntity(ctx)
    const { trigger } = await getTriggerWithConditions(ctx.triggerId)

    ctx.app.log.debug({ trigger }, 'trigger status')
    assert.equal(trigger.disabledEntity, false)
  })
})
