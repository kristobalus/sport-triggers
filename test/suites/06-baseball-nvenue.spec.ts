import { CoreOptions } from '@microfleet/core-types'

import { randomUUID } from 'crypto'
import _ = require('lodash')

import { TestContext } from '../module'
import { Scope } from '../../src/models/entities/trigger'
import { Sport } from '../../src/models/events/sport'
import { startContext, stopContext } from '../helpers/common'
import { CompareOp } from '../../src/models/entities/trigger-condition'
import {
  EssentialConditionData,
  EssentialTriggerData,
  TriggerCreateRequest,
} from '../../src/models/dto/trigger-create-request'
import { TriggerSubscribeRequest } from '../../src/models/dto/trigger-subscribe-request'
import { ItemResponse } from '../../src/models/dto/response'
import { TriggerCreateResponse } from '../../src/models/dto/trigger-create-response'
import { AdapterPushRequest } from '../../src/models/dto/adapter-push-request'
import { Defer } from '../../src/utils/defer'
import { sign } from '../../src/plugins/signed-request.plugin'
import { AtBatOutcomeState, BaseballEvents } from '../../src/sports/baseball/baseball-events'

interface SuitContext extends TestContext {
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

describe('NVenue baseball', function () {
  const sport = Sport.Baseball
  const datasource = 'nvenue'
  const scope = Scope.Game
  const scopeId = '0d996d35-85e5-4913-bd45-ac9cfedbf272'
  const entity = 'question'
  const entityId = randomUUID()

  const snapshots = {
    [BaseballEvents.AtBatOutcome]: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      sport,
      timestamp: Date.now(),
      options: {
        [BaseballEvents.AtBatOutcome]: [
          AtBatOutcomeState.FO,
          AtBatOutcomeState.IPO,
          AtBatOutcomeState.OUT ].join(','),
      },
    },
  }

  const ctx: SuitContext = {
    receiver: {
      route: 'trigger.receiver',
      payload: { id: 1 },
      entity: 'question',
      entityId: '1',
    },
  }

  async function createTrigger(ctx: SuitContext) {
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
        options: [
          {
            event: BaseballEvents.AtBatOutcome,
            compare: CompareOp.In,
            targets: [ AtBatOutcomeState.FO, AtBatOutcomeState.IPO ],
          }
        ],
      }
    ]

    const response: ItemResponse<TriggerCreateResponse> =
      await ctx.app.amqp.publishAndWait(`${amqpPrefix}.studio.trigger.create`, {
        trigger: triggerData,
        conditions: conditionData,
      } as TriggerCreateRequest)
    // console.log(response)

    ctx.triggerId = response.data.id
  }

  async function createSubscription(ctx: SuitContext) {
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

  async function createConsumer(ctx: SuitContext) {
    const { amqp } = ctx.app

    await amqp.createConsumedQueue((message) => {
      ctx.app.log.debug({ message }, 'queue received a message')
      ctx.pendingSubscriberMessage?.resolve(message)
    }, [ctx.receiver.route], { queue: 'service', noAck: true })

    ctx.pendingSubscriberMessage = new Defer<any>()
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
    await ctx.app.redis.flushall()
    await createConsumer(ctx)
    await createTrigger(ctx)
    await createSubscription(ctx)
  })

  after(async () => {
    await stopContext(ctx)
  })

  it('push snapshot', async () => {
    const { log } = ctx.app
    const event = _.merge({}, snapshots[BaseballEvents.AtBatOutcome])

    log.debug({ event }, 'sending event')

    await sendSignedRequest({ event })

    await new Promise(resolve => setTimeout(resolve, 5000))
  })

  it('should receive notification upon successful triggering', async () => {
    const message = await ctx.pendingSubscriberMessage.promise

    ctx.app.log.debug({ message }, 'message received by subscriber')
  })
})
