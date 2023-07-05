import { Microfleet } from '@microfleet/core-types'
import { AMQPTransport } from '@microfleet/transport-amqp'

import { Transform } from 'node:stream'
import { Readable } from 'stream'

import { Redis } from 'ioredis'

import { conditionKey, TriggerConditionCollection } from '../../repositories/trigger-condition.collection'
import { AdapterEvent } from '../../models/events/adapter-event'
import { ChainOp, ConditionType, TriggerCondition } from '../../models/entities/trigger-condition'
import { TriggerSubscriptionCollection } from '../../repositories/trigger-subscription.collection'
import { TriggerCollection } from '../../repositories/trigger.collection'
import { fromEvent } from '../../models/events/event-uri'
import { Trigger } from '../../models/entities/trigger'
import { Event } from "../../models/events/event"

export interface CompareResult {
  activated: boolean
  changed: boolean
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

  async evaluateTrigger(event: Event, trigger: Trigger): Promise<boolean> {
    const uri = fromEvent(event)

    this.log.debug({ event, uri }, 'incoming event')

    const conditions = await this.conditionCollection.getByTriggerId(trigger.id)

    this.log.debug({ trigger, conditions }, 'conditions found')

    for (const condition of conditions) {
      if (condition.activated) {
        continue
      }
      if (condition.uri === uri) {
        const result = await this.evaluateCondition(condition, event)

        condition.activated = result.activated
      }
    }

    let triggerResult = conditions.length > 0

    for (const condition of conditions) {
      // combine a chain of conditions into single result
      // each condition is preset by Studio with chaining operator (AND, OR)
      // for sake of simplicity assume no grouping and just apply logical operators in sequence
      if (condition.chainOperation == ChainOp.AND) {
        triggerResult = (triggerResult && condition.activated)
      } else if (condition.chainOperation == ChainOp.OR) {
        triggerResult = (triggerResult || condition.activated)
      }
    }

    if (triggerResult) {
      this.log.debug({ trigger }, 'trigger activated')
      await this.triggerCollection.updateOne(trigger.id, { activated: true })

      await this.notify(trigger.id)
      await this.cleanup(trigger.id)
    }

    return triggerResult
  }

  async getTriggersByEvent(event: AdapterEvent): Promise<Trigger[]> {
    const uri = fromEvent(event)
    const ids = await this.conditionCollection.getTriggerListByUri(uri)
    const result = []

    for (const id of ids) {
      const trigger = await this.triggerCollection.getOne(id)

      result.push(trigger)
    }

    return result
  }

  async hasTriggersForEvent(event: Event): Promise<boolean> {
    const { conditionCollection } = this
    const uri = fromEvent(event)
    const count = await conditionCollection.countTriggersByUri(uri)
    return count > 0
  }

  getTriggerStreamByEvent(event: AdapterEvent): Readable {
    const uri = fromEvent(event)
    const { triggerCollection, conditionCollection } = this

    const stream = conditionCollection.getTriggerStreamByUri(uri)

    return stream.pipe(new Transform({
      autoDestroy: true,
      objectMode: true,
      transform: function (batch, _encoding, callback) {
        (async () => {
          const result = []

          for (const id of batch) {
            const trigger = await triggerCollection.getOne(id)

            result.push(trigger)
          }
          this.push(result)
          callback()
        })().catch(callback)
      },
    }))
  }

  private evaluateCondition(
    condition: TriggerCondition,
    event: Event,
  ): Promise<CompareResult> {
    this.log.debug({ event, condition }, 'evaluating trigger condition')

    if (condition.type === ConditionType.SetAndCompare
      || condition.type === ConditionType.SetAndCompareAsString) {
      return this.setAndCompare(condition, event)
    } else if (condition.type === ConditionType.IncrAndCompare) {
      return this.incrAndCompare(condition, event)
    } else {
      this.log.fatal({ event }, 'processing flow is not implemented')

      return Promise.resolve({ activated: false, changed: false } as CompareResult)
    }
  }

  private async setAndCompare(condition: TriggerCondition, event: Event): Promise<CompareResult> {
    const key = conditionKey(condition.id)
    const current = event.value
    const result: CompareResult = {
      activated: false,
      changed: false,
    }

    try {
      const options = []

      for(const [name, value] of Object.entries(event.options)){
        options.push(name, value)
      }

      const [activated, changed] = await this.redis.set_and_compare(1, key, current, ...options)

      result.activated = !!activated
      result.changed = !!changed

      if (result.changed) {
        await this.conditionCollection.appendToEventLog(condition.id, event)
      }

      this.log.debug({ key, current, result }, 'evaluation result')
    } catch (err) {
      this.log.fatal({ err, key, current }, 'failed to compare')
      result.error = err
    }

    return result
  }

  private incrAndCompare(_condition: TriggerCondition, _event: AdapterEvent): Promise<CompareResult> {
    // run lua script
    // TODO not implemented yet
    return Promise.resolve({ activated: false, changed: false })
  }

  private async notify(triggerId: string) {
    const ids = await this.subscriptionCollection.getListByTrigger(triggerId)

    for (const id of ids) {
      const subscription = await this.subscriptionCollection.getOne(id)
      const { route, payload, options } = subscription

      await this.amqp.publishAndWait(route, { ...payload }, { ...options })
      this.log.debug({ route, payload, options, triggerId, subscriptionId: id }, 'message sent')
    }
  }

  private async cleanup(triggerId: string) {
    await this.triggerCollection.clean(triggerId)
    await this.conditionCollection.cleanByTriggerId(triggerId)
    await this.subscriptionCollection.deleteByTriggerId(triggerId)
  }
}
