import { Microfleet } from '@microfleet/core-types'
import { AMQPTransport, Publish } from '@microfleet/transport-amqp'

import { Redis } from 'ioredis'

import {
  conditionKey,
  conditionLogKey,
  TriggerConditionCollection,
} from '../../repositories/trigger-condition.collection'
import { AdapterEvent } from '../../models/events/adapter-event'
import { ChainOp, TriggerCondition } from '../../models/entities/trigger-condition'
import { TriggerSubscriptionCollection } from '../../repositories/trigger-subscription.collection'
import { TriggerCollection } from '../../repositories/trigger.collection'
import { fromEvent } from '../../models/events/event-uri'
import { Trigger } from '../../models/entities/trigger'
import { Event } from "../../models/events/event"

export interface CompareResult {
  activated: boolean
  error?: Error
}

export class AdapterService {
  private readonly conditionCollection: TriggerConditionCollection
  private readonly subscriptionCollection: TriggerSubscriptionCollection
  private readonly triggerCollection: TriggerCollection

  constructor(
    private readonly log: Microfleet['log'],
    private readonly redis: Redis,
    private readonly amqp: AMQPTransport,
    options?: { triggerLifetimeSeconds?: number },
  ) {
    this.triggerCollection = new TriggerCollection(this.redis, options?.triggerLifetimeSeconds)
    this.conditionCollection = new TriggerConditionCollection(this.redis, options?.triggerLifetimeSeconds)
    this.subscriptionCollection = new TriggerSubscriptionCollection(this.redis, options?.triggerLifetimeSeconds)
  }

  /**
   * executed in queue "triggers"
   */
  async evaluateTrigger(event: Event, triggerId: string): Promise<boolean> {
    const trigger = await this.triggerCollection.getOne(triggerId)
    const uri = fromEvent(event)
    const conditions = await this.conditionCollection.getByTriggerId(trigger.id)

    this.log.debug({ event, uri, trigger, conditions }, 'evaluating trigger')

    for (const condition of conditions) {
      if (condition.activated) {
        continue
      }
      if (condition.uri === uri) {
        const result = await this.evaluateCondition(condition, event)

        condition.activated = result.activated
      }
    }

    let result = conditions.length > 0

    for (const condition of conditions) {
      // combine a chain of conditions into single result
      // each condition is preset by Studio with chaining operator (AND, OR)
      // for sake of simplicity assume no grouping and just apply logical operators in sequence
      if (condition.chainOperation == ChainOp.AND) {
        result = (result && condition.activated)
      } else if (condition.chainOperation == ChainOp.OR) {
        result = (result || condition.activated)
      }
    }

    if ( result ) {
      await this.conditionCollection.unsubscribeTriggerFromEvents(trigger.id)
    }

    // store trigger status
    await this.triggerCollection.updateOne(trigger.id, { activated: result })

    this.log.debug({ result, triggerId }, 'trigger evaluation result')

    return result
  }

  /**
   * executed in queue "notifications"
   * separate queue for notifications (with retries)
   */
  async notify(triggerId: string) {
    const trigger = await this.triggerCollection.getOne(triggerId)
    if (trigger.activated) {
      this.log.debug({ triggerId }, 'sending subscriptions')

      // TODO
      //  add limitations on notification routes [whitelist] and payloads [json schema] and exclude options?
      const ids = await this.subscriptionCollection.getListByTrigger(trigger.id)

      for (const id of ids) {
        const subscription = await this.subscriptionCollection.getOne(id)
        if ( !subscription.sent ) {
          const { route, payload } = subscription

          await this.amqp.publish(route, { ...payload }, {
            confirm: true,
            mandatory: true
          } as Publish)

          await this.subscriptionCollection.updateOne(subscription.id, { sent: true })

          this.log.debug({ trigger, subscription }, 'message sent')
        }
      }
    } else {
      this.log.warn({ trigger }, 'trying to send notification on trigger w/o activation')
    }
  }


  /**
   * @description shows if any trigger is interested in this event
   */
  async hasTriggers(event: Event): Promise<boolean> {
    const { conditionCollection } = this
    const uri = fromEvent(event)
    const count = await conditionCollection.countSubscribedToUri(uri)
    return count > 0
  }

  /**
   * @description get triggers subscribed to event by their conditions
   */
  async * getTriggers(event: AdapterEvent) : AsyncGenerator<Trigger[], void, void>  {
    const uri = fromEvent(event)
    const { triggerCollection, conditionCollection } = this

    const triggerIdGenerator = conditionCollection.getSubscribedToUri(uri)
    for await (let batch of triggerIdGenerator) {
      // noinspection JSMismatchedCollectionQueryUpdate
      const result: Trigger[] = []
      for (const id of batch) {
        const trigger = await triggerCollection.getOne(id)
        result.push(trigger)
      }
      yield result
    }
  }

  private async evaluateCondition(
    condition: TriggerCondition,
    event: Event,
  ): Promise<CompareResult> {
    this.log.debug({ event, condition }, 'evaluating condition')

    const key = conditionKey(condition.id)
    const logKey = conditionLogKey(condition.id)
    const result: CompareResult = {
      activated: false
    }

    const [activated, debug] = await this.redis.set_and_compare(2, key, logKey, JSON.stringify(event))
    result.activated = !!activated
    this.log.debug({ key, debug: debug ? JSON.parse(debug) : {}, result }, 'condition evaluation result')

    return result
  }

}
