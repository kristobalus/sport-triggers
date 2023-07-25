import { CoreOptions } from '@microfleet/core-types'

import { randomUUID } from 'crypto'
import assert = require("assert")

import { TestContext } from '../module'
import { Scope } from '../../src/models/entities/trigger'
import { startContext, stopContext } from '../helpers/common'

import { ChainOp, CompareOp } from '../../src/models/entities/trigger-condition'
import {
  EssentialConditionData,
  EssentialTriggerData,
  TriggerCreateRequest,
} from '../../src/models/dto/trigger-create-request'
import { GameLevel } from '../../src/studio/basketball/game-level'
import { TriggerSubscribeRequest } from '../../src/models/dto/trigger-subscribe-request'
import { ItemResponse } from '../../src/models/dto/response'
import { TriggerCreateResponse } from '../../src/models/dto/trigger-create-response'
import { AdapterPushRequest } from '../../src/models/dto/adapter-push-request'
import { TriggerWithConditions } from '../../src/models/dto/trigger-with-conditions'
import { TriggerGetRequest } from '../../src/models/dto/trigger-get-request'
import { Defer } from "../../src/utils/defer"
import { BasketballEvents } from "../../src/studio/basketball/basketball-events"


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

describe('AdapterService', function () {

  const datasource = "sportradar"
  const scope = Scope.Game
  const scopeId = randomUUID()
  const entity = 'moderation'
  const entityId = randomUUID()
  const homeId = randomUUID()
  const awayId = randomUUID()

  const events = {
    gameLevelStart: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now(),
      options: {
        [BasketballEvents.GameLevel]: GameLevel.Start
      }
    },
    homeTeamPoints: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now() + 1,
      options: {
        [BasketballEvents.GamePointsHome]: "30",
        [BasketballEvents.Team]: homeId
      }
    },
    wrongTeamShootingFoul: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now() + 2,
      options: {
        [BasketballEvents.TeamShootingFoul]: awayId,
        [BasketballEvents.Team]: awayId
      }
    },
    correctTeamShootingFoul: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now() + 3,
      options: {
        [BasketballEvents.TeamShootingFoul]: homeId,
        [BasketballEvents.Team]: homeId
      }
    }
  }

  const ctx: SuitContext = {
    receiver: {
      route: 'trigger.receiver',
      payload: { id: 1 },
      entity: 'question',
      entityId: '1'
    }
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
        event: BasketballEvents.GameLevel,
        compare: CompareOp.Equal,
        targets: [
          GameLevel.Start
        ],
        options: []
      },
      {
        event: BasketballEvents.GamePointsHome,
        compare: CompareOp.Equal,
        targets: [ "30" ],
        chainOperation: ChainOp.AND,
        options: [
          {
            event: BasketballEvents.Team,
            compare: CompareOp.In,
            targets: [ homeId ]
          }
        ]
      },
      {
        event: BasketballEvents.TeamShootingFoul,
        compare: CompareOp.In,
        targets: [
           homeId
        ],
        chainOperation: ChainOp.AND,
        options: [
          {
            event: BasketballEvents.Team,
            compare: CompareOp.In,
            targets: [
              homeId
            ]
          }
        ]
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

  async function getTriggerActivated(): Promise<boolean> {
    const response: ItemResponse<TriggerWithConditions> =
      await ctx.app.amqp.publishAndWait(`${ctx.amqpPrefix}.studio.trigger.get`,
        { id: ctx.triggerId } as TriggerGetRequest)


    assert.ok(response)
    assert.ok(response.data)

    const item = response.data

    assert.ok(item.type)
    assert.equal(item.type, 'trigger')
    assert.equal(item.type, 'trigger')

    // console.log("getTriggerActivated:", JSON.stringify(item.attributes.trigger.activated))

    return item.attributes.trigger.activated
  }

  before(async () => {
    await startContext(ctx, {
      logger: {
        debug: true,
        prettifyDefaultLogger: false,
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

  it('push game level event', async () => {
    const defer = new Defer()
    ctx.app.queueService.triggerJobCallback = (result) => defer.resolve(result)
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.gameLevelStart,
      } as AdapterPushRequest,
    })
    const { result } = await defer.promise
    assert.equal(result, false)
  })

  it('push home team points event', async () => {
    const defer = new Defer()
    ctx.app.queueService.triggerJobCallback = (result) => defer.resolve(result)
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.homeTeamPoints,
      } as AdapterPushRequest,
    })
    const { result } = await defer.promise
    assert.equal(result, false)
  })

  it('push wrong foul event', async () => {
    const defer = new Defer()
    ctx.app.queueService.triggerJobCallback = (result) => defer.resolve(result)
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.wrongTeamShootingFoul,
      } as AdapterPushRequest,
    })
    const { result } = await defer.promise
    assert.equal(result, false)
  })

  it('push correct foul event', async () => {

    ctx.pendingSubscriberMessage = new Defer()
    const defer = new Defer()

    ctx.app.queueService.triggerJobCallback = (result) => defer.resolve(result)

    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.correctTeamShootingFoul,
      } as AdapterPushRequest,
    })

    const { result } = await defer.promise
    assert.equal(result, true)

    const message = await ctx.pendingSubscriberMessage.promise
    ctx.app.log.debug({ message }, 'message received by subscriber')
    assert.equal(await getTriggerActivated(), true)
  })

})
