import { Microfleet } from '@microfleet/core-types'

import { Redis } from 'ioredis'

import { TriggerCollection } from '../../repositories/trigger.collection'
import { TriggerConditionCollection } from '../../repositories/trigger-condition.collection'
import { TriggerSubscriptionCollection } from '../../repositories/trigger-subscription.collection'
import { EssentialConditionData, EssentialTriggerData } from '../../models/dto/trigger-create-request'
import { TriggerWithConditions } from '../../models/dto/trigger-with-conditions'
import { EssentialSubscriptionData } from '../../models/dto/trigger-subscribe-request'
import { TriggerSubscription } from '../../models/entities/trigger-subscription'
import { metadata } from '../../models/events/event-metadata'
import { ArgumentError } from "common-errors"

export interface TriggerOptions {
  showLog?: boolean
  trim?: boolean
}

export class StudioService {
  private triggers: TriggerCollection
  private conditions: TriggerConditionCollection
  private subscriptions: TriggerSubscriptionCollection

  constructor(
    private log: Microfleet['log'],
    private redis: Redis,
    options?: { triggerLifetimeSeconds?: number }
  ) {
    this.triggers = new TriggerCollection(this.redis, options?.triggerLifetimeSeconds)
    this.conditions = new TriggerConditionCollection(this.redis, options?.triggerLifetimeSeconds)
    this.subscriptions = new TriggerSubscriptionCollection(this.redis, options?.triggerLifetimeSeconds)
  }

  /**
   * @description Studio creates trigger specifying entity data to be attached to.
   *              Studio supplies conditions for the trigger to be activated upon matching.
   *              When building conditions Studio should use metadata information
   *              to provide allowed compare operations and targets for the event.
   * @param triggerData
   * @param conditionData
   */
  async createTrigger(triggerData: EssentialTriggerData, conditionData: EssentialConditionData[]) {
    this.log.debug({ trigger: triggerData, conditions: conditionData }, 'create trigger')

    let id
    try {
      id = await this.triggers.add(triggerData)
    } catch (err){
      this.log.fatal({ err }, 'failed to create trigger instance')
      throw new ArgumentError('failed to create trigger', err)
    }

    try {
      await this.conditions.add(id, triggerData.scope, triggerData.scopeId, conditionData)
    } catch(err){
      if(id) {
        await this.triggers.deleteOne(id)
      }
      this.log.fatal({ err }, 'failed to create condition instance')
      throw new ArgumentError('failed to create trigger', err)
    }

    return id
  }

  /**
   * @description returns to Studio a list of triggers attached to the entity { entity, entityId }
   * @param entity
   * @param entityId
   * @param options
   */
  async getTriggerListByEntity(
    entity: string,
    entityId: string,
    options: TriggerOptions = {}): Promise<TriggerWithConditions[]> {
    const ids = await this.triggers.getListByEntity(entity, entityId)
    const items = []

    for (const id of ids) {
      const trigger = await this.getTrigger(id, options)

      items.push(trigger)
    }

    return items
  }

  /**
   * @description returns to Studio a list of triggers attached to scope,
   *              e.g "datasource.game" + game identifier
   * @param scope
   * @param scopeId
   * @param options
   */
  async getTriggerListByScope(
    scope: string,
    scopeId: string,
    options: TriggerOptions = {}): Promise<TriggerWithConditions[]> {
    const ids = await this.triggers.getListByScope(scope, scopeId)
    const items = []

    for (const id of ids) {
      const trigger = await this.getTrigger(id, options)

      items.push(trigger)
    }

    return items
  }

  /**
   * @description Method returns a list of subscriptions attached to the trigger by subscribed entity,
   *              e.g. question can be subscribed.
   *              Upon trigger activation those subscriptions will be notified by amqp message to
   *              appropriate route with given payload.
   * @param entity
   * @param entityId
   */
  async getSubscriptionListByEntity(entity: string, entityId: string): Promise<TriggerSubscription[]> {
    const ids = await this.subscriptions.getListByEntity(entity, entityId)
    const items = []

    for (const id of ids) {
      const item = await this.subscriptions.getOne(id)

      items.push(item)
    }

    return items
  }

  /**
   * @description returns
   * @param triggerId
   */
  async getSubscriptionListByTrigger(triggerId: string): Promise<TriggerSubscription[]> {
    const ids = await this.subscriptions.getListByTrigger(triggerId)
    const items = []

    for (const id of ids) {
      const item = await this.subscriptions.getOne(id)

      items.push(item)
    }

    return items
  }

  async deleteTrigger(triggerId: string) {
    await this.triggers.deleteOne(triggerId)
    await this.conditions.deleteByTriggerId(triggerId)
    await this.subscriptions.deleteByTriggerId(triggerId)
  }

  /**
   * @description Creates subscription for the trigger.
   *              Studio supplies "route" and "payload" to be forwarded to the route upon trigger
   *              activation;
   *              e.g. Studio can schedule question activation upon player touchdown,
   *
   * @param triggerId
   * @param data
   */
  subscribeTrigger(triggerId: string, data: EssentialSubscriptionData): Promise<string> {
    return this.subscriptions.create(triggerId, data)
  }

  cancelSubscription(subscriptionId: string) {
    return this.subscriptions.deleteOne(subscriptionId)
  }

  async getTrigger(id: string, options: TriggerOptions = {}): Promise<TriggerWithConditions> {
    const trigger = await this.triggers.getOne(id)
    const conditions = await this.conditions.getByTriggerId(id, { showLog: options.showLog })

    if (options.trim) {
      for (const condition of conditions) {
        condition.scopeId = undefined
        condition.scope = undefined
        condition.triggerId = undefined
        condition.type = undefined
      }
    }

    return { trigger, conditions } as TriggerWithConditions
  }

  getMetadata() {
    return metadata
  }
}
