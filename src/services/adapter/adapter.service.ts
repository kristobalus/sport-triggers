import { Microfleet } from '@microfleet/core-types'
import { AMQPTransport, Publish } from '@microfleet/transport-amqp'

import { Redis } from 'ioredis'

import {
  intersection,
  TriggerConditionCollection,
} from '../../repositories/trigger-condition.collection'
import { getEventUriListBySnapshot, ScopeSnapshot } from '../../models/events/scope-snapshot'
import { TriggerCondition } from '../../models/entities/trigger-condition'
import { TriggerSubscriptionCollection } from '../../repositories/trigger-subscription.collection'
import { TriggerCollection } from '../../repositories/trigger.collection'
import { getEventUri } from '../../models/events/event-uri'
import { Trigger } from '../../models/entities/trigger'
import { getSnapshotKey, ScopeSnapshotCollection } from '../../repositories/scope-snapshot.collection'
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
  private readonly triggerConditionCollection: TriggerConditionCollection
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
    this.triggerConditionCollection = options.conditionCollection
    this.subscriptionCollection = options.subscriptionCollection
    this.triggerLimitCollection = options.triggerLimitCollection
    this.snapshotCollection = options.scopeSnapshotCollection
    this.entityLimitCollection = options.entityLimitCollection
  }

  /**
   * executed in queue "store"
   */
  async storeScopeSnapshot(snapshot: ScopeSnapshot) : Promise<boolean> {
    if (await this.snapshotCollection.hasSnapshot(snapshot)) {
      return false
    }

    return this.snapshotCollection.append(snapshot)
  }

  /**
   * executed in queue "triggers"
   * atomic in respect of the flow of events
   */
  async evaluateTrigger(snapshot: ScopeSnapshot, triggerId: string): Promise<boolean> {
    const trigger = await this.triggerCollection.getOne(triggerId)

    if (trigger.disabled) {
      this.log.debug({ triggerId, snapshot }, 'trigger skipped as disabled')
      return false
    }

    if (trigger.disabledEntity) {
      this.log.debug({ triggerId, snapshot }, 'trigger skipped since entity is disabled')
      return false
    }

    const skipped = await this.shouldTriggerSkipRun(trigger, snapshot)
    if (skipped) {
      this.log.debug({ triggerId, snapshot }, 'evaluating trigger skipped')
      return false
    }

    const conditions = await this.triggerConditionCollection.getByTriggerId(trigger.id)
    const triggerLimits = await this.triggerLimitCollection.getLimits(trigger.id)
    const entityLimits = await this.entityLimitCollection.getLimits(trigger.entity, trigger.entityId)

    this.log.debug({
      snapshot,
      trigger,
      conditions,
      triggerLimits,
      entityLimits,
    }, 'evaluating trigger')

    const { datasource, scope, scopeId }  = snapshot
    const uri = Object.entries(snapshot.options).map(entry => {
      const [ eventName ] = entry
      return getEventUri({ datasource, scope, scopeId, eventName })
    })

    let activatedConditionCount = 0

    for (const condition of conditions) {
      if (!condition.activated) {
        const mutual = intersection(condition.uri, uri)

        if ( mutual.length === condition.uri.length ) {

          this.log.debug({
            'condition.id': condition.id,
            'condition.uri': condition.uri,
            'snapshot.uri': uri,
            mutual
          }, `evaluating condition`)

          const result = await this.evaluateConditionUsingEvaluator(condition, snapshot)
          condition.activated = result.activated
          // condition.current = snapshot.value
          await this.triggerConditionCollection.update(condition.id, { activated: result.activated })
        } else {
          this.log.debug({
            'condition.id': condition.id,
            'condition.uri': condition.uri,
            'snapshot.uri': uri,
            mutual
          }, `condition skipped since some uri from condition not found in the snapshot`)
        }

      } else {
        this.log.debug({
          'condition.id': condition.id,
          'condition.activated': condition.activated,
          uri,
        }, `condition skipped since it was activated earlier`)
      }

      if (condition.activated) {
        activatedConditionCount = activatedConditionCount + 1
      }
    }

    const triggerActivated =
      trigger.useConditionThreshold && trigger.threshold
        ? activatedConditionCount >= trigger.threshold
        : activatedConditionCount == conditions.length

    this.log.debug({ triggerId,
      triggerActivated,
      trigger,
      activatedConditionCount,
      totalConditionCount: conditions.length }, 'after checking threshold')

    if (triggerActivated) {
      // if trigger is activated should increment count of all events inside snapshot options
      await this.incrementCounters(trigger, snapshot)

      // reset states
      for (const condition of conditions) {
        await this.triggerConditionCollection.update(condition.id, { activated: false })
        this.log.debug({ triggerId, snapshot, conditionId: condition.id }, 'condition state reset')
      }
    }

    const next = await this.shouldTriggerRunNext(trigger)

    // store trigger status
    await this.triggerCollection.updateOne(trigger.id, { next: next })

    if (!next) {
      await this.triggerConditionCollection.unsubscribeTriggerFromEvents(trigger.id)
      this.log.debug({ triggerId, snapshot }, 'trigger unsubscribed from event, end of trigger lifecycle')
    }

    const counts = await this.triggerLimitCollection.getCounts(triggerId)

    this.log.debug({ triggerId,
      triggerActivated,
      conditionCount: activatedConditionCount,
      snapshot,
      next,
      counts }, 'trigger evaluation result')

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

      this.log.debug({ triggerId, subscription, reason }, 'subscription sent')
    }
  }

  /**
   * @description shows if any trigger is interested in this event
   */
  async hasTriggers(snapshot: ScopeSnapshot): Promise<boolean> {
    const snapshotUris = getEventUriListBySnapshot(snapshot)

    for(const uri of snapshotUris) {
      const count = await this.triggerConditionCollection.countSubscribedToUri(uri)
      if ( count > 0 ) {
        return true
      }
    }

    return false
  }

  /**
   * @description get triggers subscribed to event by their conditions
   */
  async* getTriggersByUri(uri: string): AsyncGenerator<Trigger[], void, void> {
    const triggerIdGenerator = this.triggerConditionCollection.getSubscribedToUri(uri)

    for await (const batch of triggerIdGenerator) {
      // noinspection JSMismatchedCollectionQueryUpdate
      const result: Trigger[] = []

      for (const id of batch) {
        const trigger = await this.triggerCollection.getOne(id)

        result.push(trigger)
      }
      yield result
    }
  }

  private async evaluateConditionUsingEvaluator(
    condition: TriggerCondition,
    snapshot: ScopeSnapshot,
  ): Promise<CompareResult> {

    const result: CompareResult = {
      activated: condition.activated,
    }

    const { datasource, sport, scope, scopeId, id: snapshotId } = snapshot
    const snapshotKey = getSnapshotKey({ datasource, sport, scope, scopeId, snapshotId})

    const appended = await this.triggerConditionCollection.appendToEventLog(condition.id, snapshotKey)
    if (!appended) {
      this.log.debug({ result, snapshotKey }, 'condition has already processed this event')
      return result
    }

    this.log.debug({ snapshot, condition }, 'evaluating condition using evaluator class against game snapshot')

    const evaluator = new ConditionEvaluator(this.redis, this.log)
    const activated = await evaluator.evaluate(condition, snapshot)

    result.activated = !!activated
    this.log.debug({ result }, 'condition evaluation result')

    return result
  }

  private getLimitFactories(trigger: Trigger) {
    const factories = []

    const useEntityLimits = this.entityLimitCollection.isEnabled(trigger.entity, trigger.entityId)

    if (useEntityLimits) {
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

  private async shouldTriggerSkipRun(trigger: Trigger, snapshot: ScopeSnapshot): Promise<boolean> {
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
        if (snapshot.options[limitEvent]) {
          const eventValue = snapshot.options[limitEvent]
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

  private async incrementCounters(trigger: Trigger, snapshot: ScopeSnapshot) {
    // regardless of the limits established, we count number of activation of trigger per scope (e.g. game)
    await this.triggerLimitCollection.incrCount(trigger.id, snapshot.id, CommonLimit.Scope, snapshot.scopeId)

    // regardless of the limits established, we count number of activation of trigger per minute
    await this.triggerLimitCollection.incrCount(trigger.id, snapshot.id, CommonLimit.Minute, null)

    for (const [eventName, eventValue] of Object.entries(snapshot.options)) {
      await this.triggerLimitCollection.incrCount(trigger.id, snapshot.id, eventName, eventValue)
      await this.entityLimitCollection.incrCount(trigger.entity, trigger.entityId, snapshot.id, eventName, eventValue)
    }

    this.log.debug({ snapshot }, 'trigger counters incremented')
  }
}
