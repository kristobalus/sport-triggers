import { CoreOptions } from "@microfleet/core-types"

import { randomUUID } from "crypto"
import { strict as assert } from "assert"

import { TestContext } from "../module"
import { Scope } from "../../src/models/entities/trigger"
import { startContext, stopContext } from "../helpers/common"
import { FootballEvents } from "../../src/models/events/football/football-events"
import { ChainOp, CompareOp } from "../../src/models/entities/trigger-condition"
import {
  EssentialConditionData,
  EssentialTriggerData,
  TriggerCreateRequest,
} from "../../src/models/dto/trigger-create-request"
import { GameLevel } from "../../src/models/events/football/football-game-level.event"
import { TriggerSubscribeRequest } from "../../src/models/dto/trigger-subscribe-request"
import { ItemResponse } from "../../src/models/dto/response"
import { TriggerCreateResponse } from "../../src/models/dto/trigger-create-response"
import { AdapterPushRequest } from "../../src/models/dto/adapter-push-request"
import { Event } from "../../src/models/events/event"

interface SuitContext extends TestContext {
  amqpPrefix?: string
  triggerId?: string
  subscriptionId?: string
  consumer?: any
  pending?: Promise<any>
  resolvePending?: any
}

describe(`AdapterService`, function () {

  const scope = Scope.SportradarGames
  const scopeId = randomUUID()
  const entity = "moderation"
  const entityId = randomUUID()

  // const events = {
  //   event1: {
  //     name: FootballEvents.GameLevel,
  //   } as BaseEvent,
  //   event2: {
  //     name: FootballEvents.GamePointsHome,
  //   } as BaseEvent,
  // }

  const ctx: SuitContext = {}

  async function createTrigger(ctx: SuitContext) {
    const { amqpPrefix } = ctx

    const response: ItemResponse<TriggerCreateResponse> =
      await ctx.service.amqp.publishAndWait(`${amqpPrefix}.studio.trigger.create`, {
        trigger: {
          name: "...",
          description: "..",
          scope,
          scopeId,
          entity,
          entityId,
        } as EssentialTriggerData,
        conditions: [
          {
            event: FootballEvents.GameLevel,
            compare: CompareOp.Equal,
            target: GameLevel.Start,
          },
          {
            event: FootballEvents.GamePointsHome,
            compare: CompareOp.GreaterOrEqual,
            target: "30",
            chainOperation: ChainOp.AND,
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
          route: "trigger",
          payload: { id: 1 },
          entity: "question",
          entityId: "1",
        },
      } as TriggerSubscribeRequest)

    ctx.subscriptionId = response.data.id
  }

  async function createConsumer(ctx: SuitContext) {
    const { amqp } = ctx.service

    // const { queue } = await amqp.createQueue({
    //   queue: 'service',
    //   arguments: {
    //     'x-max-priority': 5,
    //   },
    // })
    // await queue.bind("amq.direct", "on.trigger")
    // ctx.consumer = await amqp.consume("service", { noAck: true } as ConsumeOpts, (_message) => {
    //   console.log(_message)
    // })

    await amqp.createConsumedQueue((message) => {
      ctx.resolvePending?.(message)
      ctx.resolvePending = null
    }, ["trigger"], { queue: "service", noAck: true })

    ctx.pending = new Promise((resolve) => ctx.resolvePending = resolve)
  }

  before(async () => {
    await startContext(ctx, {
      logger: {
        debug: true,
        options: {
          level: "trace",
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

  it(`push event ${FootballEvents.GameLevel}`, async () => {
    assert(ctx.request, `context has no "got" instance`)
    await ctx.request.post("adapter/event/push", {
      json: {
        event: {
          id: randomUUID(),
          name: FootballEvents.GameLevel,
          value: GameLevel.Start,
          scope,
          scopeId,
          timestamp: Date.now()
        } as Required<Event>,
      } as AdapterPushRequest,
    })
  })

  it(`push event ${FootballEvents.GamePointsHome}`, async () => {
    await ctx.request.post("adapter/event/push", {
      json: {
        event: {
          id: randomUUID(),
          name: FootballEvents.GamePointsHome,
          value: "30",
          scope,
          scopeId,
          timestamp: Date.now()
        },
      } as AdapterPushRequest,
    })
  })

  it(`check trigger activated`, async () => {
    const message = await ctx.pending
    assert.ok(message)
    assert.equal(message.id, 1)
  })
})
