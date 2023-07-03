import { Microfleet } from '@microfleet/core-types'
import { AMQPTransport } from '@microfleet/transport-amqp'

import { Transform } from 'node:stream'
import { Readable } from 'stream'

import { Redis } from 'ioredis'

import { conditionKey, TriggerConditionCollection } from '../../repositories/trigger-condition.collection'
import { Event } from '../../models/events/event'
import { ChainOp, ConditionType, TriggerCondition } from '../../models/entities/trigger-condition'
import { TriggerSubscriptionCollection } from '../../repositories/trigger-subscription.collection'
import { TriggerCollection } from '../../repositories/trigger.collection'
import { toUriByEvent } from '../../models/events/uri'
import { Trigger } from '../../models/entities/trigger'

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

  async pushEvent(event: Event) {
    const uri = toUriByEvent(event)

    this.log.debug({ event, uri }, 'incoming event')

    const { scope, scopeId, name } = event
    const triggers = await this.conditionCollection.getTriggerListByScopeAndEventName(scope, scopeId, name)

    this.log.debug({ triggers }, 'triggers found for pushed event')

    for (const triggerId of triggers) {
      const trigger = await this.triggerCollection.getOne(triggerId)

      if (trigger.activated) {
        continue
      }
      await this.evaluateTrigger(event, trigger)
    }
  }

  async evaluateTrigger(event: Event, trigger: Trigger): Promise<boolean> {
    const uri = toUriByEvent(event)

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

  async getTriggersByEvent(event: Event): Promise<Trigger[]> {
    const uri = toUriByEvent(event)
    const ids = await this.conditionCollection.getTriggerListByUri(uri)
    const result = []

    for (const id of ids) {
      const trigger = await this.triggerCollection.getOne(id)

      result.push(trigger)
    }

    return result
  }

  async hasTriggers(event: Event): Promise<boolean> {
    const uri = toUriByEvent(event)
    const { conditionCollection } = this
    const count = await conditionCollection.countTriggersByUri(uri)

    return count > 0
  }

  getTriggerStreamByEvent(event: Event): Readable {
    const uri = toUriByEvent(event)
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
      }
    }))
  }

  private evaluateCondition(
    condition: TriggerCondition,
    event: Event,
  ): Promise<CompareResult> {
    this.log.debug({ event, condition }, 'evaluating trigger condition')

    if (condition.type === ConditionType.SetAndCompare) {
      return this.setAndCompare(condition.id, event)
    } else if (condition.type === ConditionType.SetAndCompareAsString) {
      return this.setAndCompareAsString(condition.id, event)
    } else if (condition.type === ConditionType.IncrAndCompare) {
      return this.incrAndCompare(condition.id, event)
    } else {
      this.log.fatal({ event }, 'processing flow is not implemented')

      return Promise.resolve({ activated: false, changed: false } as CompareResult)
    }
  }

  private async setAndCompare(conditionId: string, event: Event): Promise<CompareResult> {
    const key = conditionKey(conditionId)
    const current = event.value

    const result: CompareResult = {
      activated: false,
      changed: false,
    }

    try {
      const [activated, changed] = await this.redis.set_and_compare(1, key, current)

      result.activated = !!activated
      result.changed = !!changed

      if (result.changed) {
        await this.conditionCollection.appendToEventLog(conditionId, event)
      }

      this.log.debug({ key, current, result }, 'evaluation result')
    } catch (err) {
      this.log.fatal({ err, key, current }, 'failed to compare')
      result.error = err
    }

    return result
  }

  private async setAndCompareAsString(conditionId: string, event: Event): Promise<CompareResult> {
    const key = conditionKey(conditionId)
    const current = event.value

    const result: CompareResult = {
      activated: false,
      changed: false,
    }

    try {
      const [activated, changed] = await this.redis.set_and_compare_as_string(1, key, current)

      result.activated = !!activated
      result.changed = !!changed

      if (result.changed) {
        await this.conditionCollection.appendToEventLog(conditionId, event)
      }

      this.log.debug({ key, current, result }, 'evaluation result')
    } catch (err) {
      this.log.fatal({ err, key, current }, 'failed to compare')
      result.error = err
    }

    return result
  }

  private incrAndCompare(_conditionId: string, _event: Event): Promise<CompareResult> {
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
