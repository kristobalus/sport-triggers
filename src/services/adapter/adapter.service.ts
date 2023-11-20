import { Microfleet } from '@microfleet/core-types'
import { AMQPTransport, Publish } from '@microfleet/transport-amqp'

import { Redis } from 'ioredis'

import {
  conditionKey,
  conditionLogKey,
  TriggerConditionCollection,
} from '../../repositories/trigger-condition.collection'
import { ScopeSnapshot } from '../../models/events/scope-snapshot'
import { TriggerCondition } from '../../models/entities/trigger-condition'
import { TriggerSubscriptionCollection } from '../../repositories/trigger-subscription.collection'
import { TriggerCollection } from '../../repositories/trigger.collection'
import { getUriFromEvent } from '../../models/events/event-uri'
import { Trigger } from '../../models/entities/trigger'
import { EventSnapshot } from '../../models/events/event-snapshot'
import {
  getSnapshotKeyByEntity,
  ScopeSnapshotCollection,
} from '../../repositories/scope-snapshot.collection'
import { TriggerLimitCollection } from '../../repositories/trigger-limit.collection'
import { SubscriptionNotification } from '../../models/dto/subscription-notification'
import { EntityLimitCollection } from '../../repositories/entity-limit.collection'
import { ConditionEvaluator } from './condition-evaluator'
import { limits as limitDictionary } from '../../sports'
import { CommonLimit } from '../../sports/common-limits'

export interface CompareResult {
  activated: boolean
  error?: Error
}

export interface AdapterServiceOptions {
  log: Microfleet['log'],
  redis: Redis,
  amqp: AMQPTransport,
  conditionCollection: TriggerConditionCollection
  subscriptionCollection: TriggerSubscriptionCollection
  triggerCollection: TriggerCollection
  scopeSnapshotCollection: ScopeSnapshotCollection
  triggerLimitCollection: TriggerLimitCollection
  entityLimitCollection: EntityLimitCollection
}

export class AdapterService {
  private readonly log: Microfleet['log']
  private readonly redis: Redis
  private readonly amqp: AMQPTransport
  private readonly conditionCollection: TriggerConditionCollection
  private readonly subscriptionCollection: TriggerSubscriptionCollection
  private readonly triggerCollection: TriggerCollection
  private readonly snapshotCollection: ScopeSnapshotCollection
  private readonly triggerLimitCollection: TriggerLimitCollection
  // @ts-ignore
  private readonly entityCollection: EntityCollection
  private readonly entityLimitCollection: EntityLimitCollection

  constructor(options: AdapterServiceOptions) {
    this.log = options.log
    this.redis = options.redis
    this.amqp = options.amqp
    this.triggerCollection = options.triggerCollection
    this.conditionCollection = options.conditionCollection
    this.subscriptionCollection = options.subscriptionCollection
    this.triggerLimitCollection = options.triggerLimitCollection
    this.snapshotCollection = options.scopeSnapshotCollection
    this.entityLimitCollection = options.entityLimitCollection
  }

  /**
   * executed in queue "store"
   */
  async storeScopeSnapshot(snapshot: ScopeSnapshot) {
    await this.snapshotCollection.append(snapshot)
  }

  /**
   * executed in queue "triggers"
   * atomic in respect of the flow of events
   */
  async evaluateTrigger(eventSnapshot: EventSnapshot, triggerId: string): Promise<boolean> {
    const trigger = await this.triggerCollection.getOne(triggerId)

    if (trigger.disabled) {
      this.log.debug({ triggerId }, 'trigger skipped as disabled')
      return false
    }

    if (trigger.disabledEntity) {
      this.log.debug({ triggerId }, 'trigger skipped since entity is disabled')
      return false
    }

    const skipped = await this.shouldTriggerSkipRun(trigger, eventSnapshot)
    if (skipped) {
      this.log.debug({ triggerId }, 'evaluating trigger skipped')
      return false
    }

    const uri = getUriFromEvent(eventSnapshot)
    const conditions = await this.conditionCollection.getByTriggerId(trigger.id)
    const triggerLimits = await this.triggerLimitCollection.getLimits(trigger.id)
    const entityLimits = await this.entityLimitCollection.getLimits(trigger.entity, trigger.entityId)

    this.log.debug({
      eventSnapshot,
      uri,
      trigger,
      conditions,
      triggerLimits,
      entityLimits,
    }, 'evaluating trigger')

    let conditionCount = 0

    for (const condition of conditions) {
      if (!condition.activated && condition.uri === uri) {
        // condition was not activated by previous snapshots
        // and condition uri matched the event uri
        const result = await this.evaluateConditionUsingEvaluator(condition, eventSnapshot)

        condition.activated = result.activated
        condition.current = eventSnapshot.value

        await this.conditionCollection.update(condition.id, {
          activated: result.activated,
          current: eventSnapshot.value,
        })

      } else {
        this.log.trace({
          'condition.id': condition.id,
          'condition.activated': condition.activated,
          'condition.uri': condition.uri,
          uri,
        }, `condition skipped`)
      }
      if (condition.activated) {
        conditionCount = conditionCount + 1
      }
    }

    const triggerActivated =
      trigger.useConditionThreshold && trigger.threshold
        ? conditionCount >= trigger.threshold
        : conditionCount == conditions.length

    if (triggerActivated) {
      // if trigger is activated should increment count of all events inside snapshot options
      await this.incrementCounters(trigger, eventSnapshot)

      // reset states
      for (const condition of conditions) {
        await this.conditionCollection.update(condition.id, { activated: false })
      }
    }

    const next = await this.shouldTriggerRunNext(trigger)

    // store trigger status
    await this.triggerCollection.updateOne(trigger.id, { next: next })

    if (!next) {
      await this.conditionCollection.unsubscribeTriggerFromEvents(trigger.id)
    }

    const counts = await this.triggerLimitCollection.getCounts(triggerId)

    this.log.debug({ triggerId, triggerActivated, conditionCount, next, counts }, 'trigger evaluation result')

    return triggerActivated
  }

  /**
   * executed in queue "notifications"
   * separate queue for notifications (with retries)
   */
  async notify(triggerId: string, reason: string) {
    const trigger = await this.triggerCollection.getOne(triggerId)

    this.log.debug({ triggerId }, 'sending subscriptions')

    const ids = await this.subscriptionCollection.getListByTrigger(triggerId)
    const limits = await this.triggerLimitCollection.getLimits(triggerId)
    const counts = await this.triggerLimitCollection.getCounts(triggerId)

    for (const id of ids) {
      const count = await this.subscriptionCollection.addReason(id, reason)
      if (count == 0) {
        // skipped, subscription was already notified
        continue
      }

      const subscription = await this.subscriptionCollection.getOne(id)
      const { route, payload } = subscription

      await this.amqp.publish(route,
        {
          payload,
          limits,
          counts,
          next: trigger.next,
          triggerId: trigger.id,
          entity: trigger.entityId,
          entityId: trigger.entityId,
          scopeId: trigger.scopeId,
          scope: trigger.scope,
        } as SubscriptionNotification, {
          confirm: true,
          mandatory: true,
        } as Publish)

      this.log.debug({ triggerId, subscription }, 'subscription sent')
    }
  }

  /**
   * @description shows if any trigger is interested in this event
   */
  async hasTriggers(event: EventSnapshot): Promise<boolean> {
    const { conditionCollection } = this
    const uri = getUriFromEvent(event)
    const count = await conditionCollection.countSubscribedToUri(uri)

    return count > 0
  }

  /**
   * @description get triggers subscribed to event by their conditions
   */
  async* getTriggersBySnapshot(snapshot: ScopeSnapshot): AsyncGenerator<Trigger[], void, void> {
    const uri = getUriFromEvent(snapshot)
    const { triggerCollection, conditionCollection } = this

    const triggerIdGenerator = conditionCollection.getSubscribedToUri(uri)

    for await (const batch of triggerIdGenerator) {
      // noinspection JSMismatchedCollectionQueryUpdate
      const result: Trigger[] = []

      for (const id of batch) {
        const trigger = await triggerCollection.getOne(id)

        result.push(trigger)
      }
      yield result
    }
  }

  // @ts-ignore
  private async evaluateConditionUsingLuaScript(
    condition: TriggerCondition,
    event: EventSnapshot,
  ): Promise<CompareResult> {
    this.log.debug({ event, condition }, 'evaluating condition using lua script')

    const key = conditionKey(condition.id)
    const logKey = conditionLogKey(condition.id)
    const result: CompareResult = {
      activated: false,
    }

    // TODO now logic is moved into lua script
    //   however since we are using bullmq and this method is guaranteed to be called with single concurrent
    //   there is no point of using lua here.
    //   it would be much easier to shift comparison and aggregation logic into Javascript domain
    //   to keep things simple
    const [activated, debug] = await this.redis.set_and_compare(2, key, logKey, JSON.stringify(event))

    result.activated = !!activated
    this.log.debug({ key, debug: debug ? JSON.parse(debug) : {}, result }, 'condition evaluation result')

    // const evaluator = new ConditionEvaluator(this.redis, this.log)
    // await evaluator.evaluate(condition, event)

    return result
  }

  // @ts-ignore
  private async evaluateConditionUsingEvaluator(
    condition: TriggerCondition,
    eventSnapshot: EventSnapshot,
  ): Promise<CompareResult> {
    this.log.trace({ eventSnapshot, condition }, 'evaluating condition using evaluator class')

    const result: CompareResult = {
      activated: condition.activated,
    }

    const snapshotKey = getSnapshotKeyByEntity(eventSnapshot)
    const appended = await this.conditionCollection.appendToEventLog(condition.id, snapshotKey)
    if (!appended) {
      this.log.trace({ result, snapshotKey }, 'condition has already processed this event')
      return result
    }

    const evaluator = new ConditionEvaluator(this.redis, this.log)
    const activated = await evaluator.evaluate(condition, eventSnapshot)

    result.activated = !!activated
    this.log.trace({ result }, 'condition evaluation result')

    return result
  }

  private getLimitFactories(trigger: Trigger) {
    const factories = []

    if (trigger.useEntityLimits) {
      factories.push({
        limits: async (trigger: Trigger) => {
          return this.entityLimitCollection.getLimits(trigger.entity, trigger.entityId)
        },
        count: async (trigger: Trigger, eventName: string, eventValue: any) => {
          return this.entityLimitCollection.getCount(trigger.entity, trigger.entityId, eventName, eventValue)
        },
      })
    }

    if ( trigger.useLimits ) {
      factories.push({
        limits: async (trigger: Trigger) => {
          return this.triggerLimitCollection.getLimits(trigger.id)
        },
        count: async (trigger: Trigger, eventName: string, eventValue: any) => {
          return this.triggerLimitCollection.getCount(trigger.id, eventName, eventValue)
        },
      })
    }

    return factories
  }

  private async shouldTriggerSkipRun(trigger: Trigger, eventSnapshot: EventSnapshot): Promise<boolean> {
    const factories = this.getLimitFactories(trigger)

    for (const factory of factories) {
      const limits = await factory.limits(trigger)
      for (const [limitEvent, limitCount] of Object.entries(limits)) {

        if (limitCount == 0) {
          // limit essentially disabled
          this.log.debug({ limitCount, limitEvent }, `limit disabled`)
          continue
        }

        if (limitDictionary[limitEvent]?.common) {
          // scope
          // minute
          // finite limit ignores current event value
          const activationCount = await factory.count(trigger, limitEvent, null)
          this.log.debug({ limitCount, limitEvent, activationCount }, `common limit being compared`)
          if (limitCount <= activationCount) {
            // limit reached, should stop looping
            return true
          }
        }

        // seek for limiting game event in the adapter event options
        if (eventSnapshot.options[limitEvent]) {
          const eventValue = eventSnapshot.options[limitEvent]
          const activationCount = await factory.count(trigger, limitEvent, eventValue)

          this.log.debug({ limitCount, limitEvent, activationCount, eventValue }, `limit being compared`)

          if (limitCount <= activationCount) {
            // limit reached, should skip looping
            return true
          }
        }
      }
    }

    return false
  }

  private async shouldTriggerRunNext(trigger: Trigger): Promise<boolean> {
    const factories = this.getLimitFactories(trigger)

    for (const factory of factories) {
      const limits = await factory.limits(trigger)
      for (const [limitEvent, limitCount] of Object.entries(limits)) {

        if (limitCount == 0) {
          // limit essentially disabled
          this.log.debug({ limitCount, limitEvent }, `limit disabled`)
          continue
        }

        const limit = limitDictionary[limitEvent]
        if (limit && limit.finite) {
          // finite limit ignores current event value
          const activationCount = await factory.count(trigger, limitEvent, null)

          this.log.debug({ limitCount, limitEvent, activationCount }, `limit estimate`)

          if (limitCount <= activationCount) {
            // limit reached, should stop looping
            return false
          }
        }
      }
    }

    return true
  }

  private async incrementCounters(trigger: Trigger, eventSnapshot: EventSnapshot) {
    // regardless of the limits established, we count number of activation of trigger per scope (e.g. game)
    await this.triggerLimitCollection.incrCount(trigger.id, eventSnapshot.id, CommonLimit.Scope, eventSnapshot.scopeId)
    await this.triggerLimitCollection.incrCount(trigger.id, eventSnapshot.id, CommonLimit.Minute, null)

    for (const [eventName, eventValue] of Object.entries(eventSnapshot.options)) {
      await this.triggerLimitCollection.incrCount(trigger.id, eventSnapshot.id, eventName, eventValue)
      await this.entityLimitCollection.incrCount(trigger.entity, trigger.entityId, eventSnapshot.id, eventName, eventValue)
    }
  }
}
