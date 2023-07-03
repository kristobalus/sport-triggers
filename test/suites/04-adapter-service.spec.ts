import { CoreOptions } from '@microfleet/core-types'

import { randomUUID } from 'crypto'
import { strict as assert } from 'assert'

import { TestContext } from '../module'
import { Scope } from '../../src/models/entities/trigger'
import { startContext, stopContext } from '../helpers/common'
import { FootballEvents } from '../../src/models/events/football/football-events'
import { ChainOp, CompareOp } from '../../src/models/entities/trigger-condition'
import {
  EssentialConditionData,
  EssentialTriggerData,
  TriggerCreateRequest,
} from '../../src/models/dto/trigger-create-request'
import { GameLevel } from '../../src/models/events/football/football-game-level.event'
import { TriggerSubscribeRequest } from '../../src/models/dto/trigger-subscribe-request'
import { ItemResponse } from '../../src/models/dto/response'
import { TriggerCreateResponse } from '../../src/models/dto/trigger-create-response'
import { AdapterPushRequest } from '../../src/models/dto/adapter-push-request'
import {
  FootballPlayerStateEvent,
  FootballPlayerStates,
} from '../../src/models/events/football/football-player-state.event'
import { FootballGamePointsHomeEvent } from '../../src/models/events/football/football-game-points-home.event'
import { TriggerWithConditions } from '../../src/models/dto/trigger-with-conditions'
import { TriggerGetRequest } from '../../src/models/dto/trigger-get-request'

interface SuitContext extends TestContext {
  amqpPrefix?: string
  triggerId?: string
  subscriptionId?: string
  consumer?: any
  pendingSubscriberMessage?: Promise<any>
  resolvePending?: any
  receiver?: {
    route: string
    payload: object
    entity: string
    entityId: string
  }
}

describe('AdapterService', function () {
  const scope = Scope.SportradarGames
  const scopeId = randomUUID()
  const entity = 'moderation'
  const entityId = randomUUID()

  const events = {
    gameLevelStart: {
      id: randomUUID(),
      name: FootballEvents.GameLevel,
      value: GameLevel.Start,
      scope,
      scopeId,
      timestamp: Date.now()
    },
    homeTeamPoints: {
      id: randomUUID(),
      name: FootballEvents.GamePointsHome,
      value: '30',
      scope,
      scopeId,
      timestamp: Date.now() + 1
    } as FootballGamePointsHomeEvent,
    wrongPlayerTouchdown: {
      id: randomUUID(),
      name: FootballEvents.PlayerState,
      value: FootballPlayerStates.Touchdown,
      scope,
      scopeId,
      timestamp: Date.now() + 2,
      player: randomUUID()
    } as FootballPlayerStateEvent,
    correctPlayerTouchdown: {
      id: randomUUID(),
      name: FootballEvents.PlayerState,
      value: FootballPlayerStates.Touchdown,
      scope,
      scopeId,
      timestamp: Date.now() + 3,
      player: randomUUID()
    } as FootballPlayerStateEvent,
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

    const response: ItemResponse<TriggerCreateResponse> =
      await ctx.service.amqp.publishAndWait(`${amqpPrefix}.studio.trigger.create`, {
        trigger: {
          name: '...',
          description: '..',
          scope,
          scopeId,
          entity,
          entityId,
        } as EssentialTriggerData,
        conditions: [
          {
            event: FootballEvents.GameLevel,
            compare: CompareOp.Equal,
            target: events.gameLevelStart.value,
          },
          {
            event: FootballEvents.GamePointsHome,
            compare: CompareOp.GreaterOrEqual,
            target: events.homeTeamPoints.value,
            chainOperation: ChainOp.AND,
          },
          {
            event: FootballEvents.PlayerState,
            compare: CompareOp.Equal,
            target: FootballPlayerStates.Touchdown,
            chainOperation: ChainOp.AND,
            params: {
              player: events.correctPlayerTouchdown.player
            }
          }
        ] as EssentialConditionData[],
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
      ctx.resolvePending?.(message)
      ctx.resolvePending = null
    }, [ctx.receiver.route], { queue: 'service', noAck: true })

    ctx.pendingSubscriberMessage = new Promise((resolve) => ctx.resolvePending = resolve)
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
    console.log('after')
    await stopContext(ctx)
  })

  it('push game level event', async () => {
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.gameLevelStart,
      } as AdapterPushRequest,
    })

    // assert.equal(await getTriggerActivated(), false)
  })

  it.skip('push home team points event', async () => {
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.homeTeamPoints,
      } as AdapterPushRequest,
    })

    assert.equal(await getTriggerActivated(), false)
  })

  it.skip('push wrong player touchdown event', async () => {
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.wrongPlayerTouchdown,
      } as AdapterPushRequest,
    })

    assert.equal(await getTriggerActivated(), false)
  })

  it.skip('push correct player touchdown event', async () => {
    await ctx.request.post('adapter/event/push', {
      json: {
        event: events.correctPlayerTouchdown,
      } as AdapterPushRequest,
    })

    assert.equal(await getTriggerActivated(), true)
  })

  it.skip('should send message to subscriber', async () => {
    const message = await ctx.pendingSubscriberMessage

    assert.ok(message)
    assert.equal(message.id, 1)
  })
})
