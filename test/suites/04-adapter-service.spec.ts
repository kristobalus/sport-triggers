import { CoreOptions } from '@microfleet/core-types'

import { randomUUID } from 'crypto'
import { strict as assert } from 'assert'

import { TestContext } from '../module'
import { Scope } from '../../src/models/entities/trigger'
import { startContext, stopContext } from '../helpers/common'
import { FootballEvents } from '../../src/configs/definitions/football/football-events'
import { ChainOp, CompareOp } from '../../src/models/entities/trigger-condition'
import {
  EssentialConditionData,
  EssentialTriggerData,
  TriggerCreateRequest,
} from '../../src/models/dto/trigger-create-request'
import { GameLevel } from '../../src/configs/definitions/football/football-game-level'
import { TriggerSubscribeRequest } from '../../src/models/dto/trigger-subscribe-request'
import { ItemResponse } from '../../src/models/dto/response'
import { TriggerCreateResponse } from '../../src/models/dto/trigger-create-response'
import { AdapterPushRequest } from '../../src/models/dto/adapter-push-request'
import {
  FootballPlayerState,
} from '../../src/configs/definitions/football/football-player-state'
import { TriggerWithConditions } from '../../src/models/dto/trigger-with-conditions'
import { TriggerGetRequest } from '../../src/models/dto/trigger-get-request'
import { AdapterEvent } from "../../src/models/events/adapter-event"
import { Defer } from "../../src/utils/defer"

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

  const events: Record<string, AdapterEvent> = {
    gameLevelStart: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now(),
      options: {
        [FootballEvents.GameLevel]: GameLevel.Start
      }
    },
    homeTeamPoints: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now() + 1,
      options: {
        [FootballEvents.GamePointsHome]: "30"
      }
    },
    wrongPlayerTouchdown: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now() + 2,
      options: {
        [FootballEvents.PlayerState]: FootballPlayerState.Touchdown,
        [FootballEvents.Player]: randomUUID()
      }
    },
    correctPlayerTouchdown: {
      id: randomUUID(),
      datasource,
      scope,
      scopeId,
      timestamp: Date.now() + 3,
      options: {
        [FootballEvents.PlayerState]: FootballPlayerState.Touchdown,
        [FootballEvents.Player]: randomUUID()
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
        event: FootballEvents.GameLevel,
        compare: CompareOp.Equal,
        target: events.gameLevelStart.options[FootballEvents.GameLevel],
        options: []
      },
      {
        event: FootballEvents.GamePointsHome,
        compare: CompareOp.GreaterOrEqual,
        target: events.homeTeamPoints.options[FootballEvents.GamePointsHome],
        chainOperation: ChainOp.AND,
        options: []
      },
      {
        event: FootballEvents.PlayerState,
        compare: CompareOp.Equal,
        target: FootballPlayerState.Touchdown,
        chainOperation: ChainOp.AND,
        options: [
          {
            event: FootballEvents.Player,
            compare: CompareOp.Equal,
            target: events.correctPlayerTouchdown.options[FootballEvents.Player]
          }
        ]
      }
    ]

    const response: ItemResponse<TriggerCreateResponse> =
      await ctx.service.amqp.publishAndWait(`${amqpPrefix}.studio.trigger.create`, {
        trigger: triggerData,
        conditions: conditionData,
      } as TriggerCreateRequest)

    ctx.triggerId = response.data.id
  }

  async function createSubscription(ctx: SuitContext) {
    const { amqpPrefix } = ctx

    const response: ItemResponse = await ctx.service.amqp
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
    const { amqp } = ctx.service

    await amqp.createConsumedQueue((message) => {
      ctx.pendingSubscriberMessage?.resolve(message)
    }, [ctx.receiver.route], { queue: 'service', noAck: true })

    ctx.pendingSubscriberMessage = new Defer<any>()
  }

  async function getTriggerActivated(): Promise<boolean> {
    const response: ItemResponse<TriggerWithConditions> =
      await ctx.service.amqp.publishAndWait(`${ctx.amqpPrefix}.studio.trigger.get`,
        { id: ctx.triggerId } as TriggerGetRequest)

    assert.ok(response)
    assert.ok(response.data)

    const item = response.data

    assert.ok(item.type)
    assert.equal(item.type, 'trigger')
    assert.equal(item.type, 'trigger')

    return item.attributes.trigger.activated
  }

  before(async () => {
    await startContext(ctx, {
      logger: {
        debug: true,
        options: {
          level: 'trace',
        },
      },
    } as Partial<CoreOptions>)

    ctx.amqpPrefix = ctx.service.config.routerAmqp.prefix

    await createConsumer(ctx)
    await createTrigger(ctx)
    await createSubscription(ctx)
  })

  after(async () => {
    await stopContext(ctx)
  })

  it('push game level event', async () => {
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.gameLevelStart,
      } as AdapterPushRequest,
    })

    console.log(await getTriggerActivated())
    assert.equal(await getTriggerActivated(), false)
  })

  it('push home team points event', async () => {
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.homeTeamPoints,
      } as AdapterPushRequest,
    })

    assert.equal(await getTriggerActivated(), false)
    console.log(await getTriggerActivated())
  })

  it('push wrong player touchdown event', async () => {
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.wrongPlayerTouchdown,
      } as AdapterPushRequest,
    })

    assert.equal(await getTriggerActivated(), false)
    console.log(await getTriggerActivated())
  })

  it('push correct player touchdown event', async () => {
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.correctPlayerTouchdown,
      } as AdapterPushRequest,
    })
    console.log(await getTriggerActivated())
    assert.equal(await getTriggerActivated(), true)
  })

  it('should send message to subscriber', async () => {
    const message = await ctx.pendingSubscriberMessage.promise
    console.log(message)
    assert.ok(message)
    assert.equal(message.id, 1)
  })
})
