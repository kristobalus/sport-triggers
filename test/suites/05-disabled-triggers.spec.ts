import { CoreOptions } from '@microfleet/core-types'

import { randomUUID } from 'crypto'
import assert = require('assert')

import { TestContext } from '../module'
import { Scope } from '../../src/models/entities/trigger'
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
import { AdapterPushRequest } from '../../src/models/dto/adapter-push-request'
import { TriggerWithConditions } from '../../src/models/dto/trigger-with-conditions'
import { TriggerGetRequest } from '../../src/models/dto/trigger-get-request'
import { Defer } from '../../src/utils/defer'
import { BasketballEvents } from '../../src/sports/basketball/basketball-events'
import { sign } from '../../src/plugins/signed-request.plugin'
import { TriggerDisableRequest } from "../../src/models/dto/trigger-disable-request"

interface SuiteContext extends TestContext {
  amqpPrefix?: string
  triggerId?: string
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

  const events = {
    [BasketballEvents.GameLevel]: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport: 'basketball',
      timestamp: Date.now(),
      options: {
        [BasketballEvents.GamePointsHome]: teamPoints,
        [BasketballEvents.GamePointsAway]: teamPoints,
        [BasketballEvents.Sequence]: '1',
        [BasketballEvents.Quarter]: '1',
        [BasketballEvents.Period]: '1',
        [BasketballEvents.GameLevel]: GameLevel.Start,
      },
    },
    [BasketballEvents.TeamScoresPoints]: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport: 'basketball',
      timestamp: Date.now() + 1,
      options: {
        [BasketballEvents.GamePointsHome]: teamPoints,
        [BasketballEvents.GamePointsAway]: teamPoints,
        [BasketballEvents.Sequence]: '1',
        [BasketballEvents.Quarter]: '1',
        [BasketballEvents.Period]: '1',
        [BasketballEvents.TeamScoresPoints]: teamPoints,
        [BasketballEvents.Team]: teamId,
      },
    },
    [BasketballEvents.TeamShootingFoul]: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport: 'basketball',
      timestamp: Date.now() + 3,
      options: {
        [BasketballEvents.GamePointsHome]: teamPoints,
        [BasketballEvents.GamePointsAway]: teamPoints,
        [BasketballEvents.Sequence]: '1',
        [BasketballEvents.Quarter]: '1',
        [BasketballEvents.Period]: '1',
        [BasketballEvents.TeamShootingFoul]: teamId,
        [BasketballEvents.Team]: teamId,
      },
    },
  }

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
    // console.log(response)

    ctx.triggerId = response.data.id
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

  async function isTriggerActivated(triggerId: string): Promise<boolean> {
    const response: ItemResponse<TriggerWithConditions> =
      await ctx.app.amqp.publishAndWait(`${ctx.amqpPrefix}.studio.trigger.get`,
        { id: triggerId } as TriggerGetRequest)

    assert.ok(response)
    assert.ok(response.data)

    const item = response.data

    assert.ok(item.type)
    assert.equal(item.type, 'trigger')
    assert.ok(item.attributes)
    assert.ok(item.attributes.trigger)

    return item.attributes.trigger.activated
  }

  async function sendSignedRequest(request: AdapterPushRequest) {
    const { tokenHeader, signatureHeader, algorithm, accessTokens } = ctx.app.config.signedRequest
    const body = JSON.stringify(request)

    const [accessToken] = Object.keys(accessTokens)
    const secret = accessTokens[accessToken]
    const signature = sign(algorithm, secret, body)

    ctx.app.log.info({ body, digest: signature }, 'sending signed request')

    await ctx.request.post('adapter/event/push', {
      headers: {
        [tokenHeader]: accessToken,
        [signatureHeader]: signature,
      },
      body: body,
    })
  }

  async function disableTrigger(ctx: SuiteContext, triggerId: string) {
    const { amqpPrefix } = ctx
    await ctx.app.amqp.publishAndWait(`${amqpPrefix}.studio.trigger.disable`, {
      id: triggerId
    } as TriggerDisableRequest)
  }

  before(async () => {
    await startContext(ctx, {
      logger: {
        debug: true,
        prettifyDefaultLogger: true,
        options: {
          level: 'trace',
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
    await disableTrigger(ctx, ctx.triggerId)
    const { trigger } = await getTriggerWithConditions(ctx.triggerId)
    ctx.app.log.debug({ trigger }, 'trigger status')
    assert.equal(trigger.disabled, true)
  })

  it('push game level event', async () => {
    const defer = new Defer()

    ctx.app.queueService.triggerJobCallback = (result) => defer.resolve(result)

    await sendSignedRequest({
      event: events[BasketballEvents.GameLevel],
    })

    const { activated } = await defer.promise

    assert.equal(activated, false)
    assert.equal(await isTriggerActivated(ctx.triggerId), false)
  })

  it('push team scores points event', async () => {
    const defer = new Defer()

    ctx.app.queueService.triggerJobCallback = (result) => defer.resolve(result)

    await sendSignedRequest({
      event: events[BasketballEvents.TeamScoresPoints],
    })
    const { activated } = await defer.promise

    assert.equal(activated, false)
    assert.equal(await isTriggerActivated(ctx.triggerId), false)
  })

  it('push team shooting foul event', async () => {
    ctx.pendingSubscriberMessage = new Defer()
    const defer = new Defer()

    ctx.app.queueService.triggerJobCallback = (result) => defer.resolve(result)

    await sendSignedRequest({
      event: events[BasketballEvents.TeamShootingFoul],
    })

    const { activated } = await defer.promise

    assert.equal(activated, false)
    assert.equal(await isTriggerActivated(ctx.triggerId), false)
  })

})
