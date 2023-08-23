import { Microfleet } from '@microfleet/core-types'

import { Redis } from 'ioredis'
import { ArgumentError } from 'common-errors'

import { TriggerCollection } from '../../repositories/trigger.collection'
import { TriggerConditionCollection } from '../../repositories/trigger-condition.collection'
import { TriggerSubscriptionCollection } from '../../repositories/trigger-subscription.collection'
import { EssentialConditionData, EssentialTriggerData } from '../../models/dto/trigger-create-request'
import { TriggerWithConditions } from '../../models/dto/trigger-with-conditions'
import { EssentialSubscriptionData } from '../../models/dto/trigger-subscribe-request'
import { TriggerSubscription } from '../../models/entities/trigger-subscription'
import assert from "assert"
import { Trigger } from "../../models/entities/trigger"
import { TriggerCondition } from "../../models/entities/trigger-condition"

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
   *
   * @description
   *              - Studio creates trigger specifying entity data to be attached to.
   *              - Studio supplies conditions for the trigger to be activated upon matching.
   *              - When building conditions Studio should use metadata information
   *              to provide allowed compare operations and targets for the event.
   *
   * @param triggerData
   * @param conditionData
   */
  async createTrigger(triggerData: EssentialTriggerData, conditionData: EssentialConditionData[]) {
    this.log.debug({
      trigger: triggerData,
      conditions: conditionData
    }, 'create trigger')

    let triggerId

    try {
      triggerId = await this.triggers.add(triggerData)
    } catch (err) {
      this.log.fatal({ err }, 'failed to create trigger instance')
      throw new ArgumentError('failed to create trigger', err)
    }

    try {
      await this.conditions.add(
        triggerId,
        triggerData.datasource,
        triggerData.scope,
        triggerData.scopeId,
        conditionData)
    } catch (err) {
      if (triggerId) {
        await this.triggers.deleteOne(triggerId)
      }
      this.log.fatal({ err }, 'failed to create condition instance')
      throw new ArgumentError('failed to create trigger', err)
    }

    return triggerId
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
   */
  async getTriggerListByScope(
    datasource: string,
    scope: string,
    scopeId: string,
    options: TriggerOptions = {}): Promise<TriggerWithConditions[]> {
    const ids = await this.triggers.getListByScope(datasource, scope, scopeId)
    const items = []

    for (const id of ids) {
      const trigger = await this.getTrigger(id, options)

      items.push(trigger)
    }

    return items
  }

  /**
   * @description returns a list of subscriptions for a trigger activation
   *              by subscribed { entity, entityId }
   *              Upon trigger activation these subscriptions will be notified by amqp message sent to
   *              given route with given payload. It can be any service within SL using amqp transport.
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
   * @description returns a list of subscriptions for a trigger activation
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

  /**
   * @description cancels existing subscription for trigger
   */
  cancelSubscription(subscriptionId: string) {
    return this.subscriptions.deleteOne(subscriptionId)
  }

  /**
   * @description returns trigger along with conditions,
   *              option "showLog" attaches event log to conditions
   *              options "trim" removes redundant information to reduce response size
   */
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

  async updateTrigger(triggerUpdate: Trigger, conditionsUpdate: TriggerCondition[]) {

    assert(triggerUpdate.id)

    // for(const condition of conditionsUpdate) {
    //   assert(condition.id)
    // }

    const trigger = await this.triggers.getOne(triggerUpdate.id)
    assert(trigger)

    await this.triggers.updateOne(triggerUpdate.id, triggerUpdate)

    if ( conditionsUpdate.length ) {
      await this.conditions.add(trigger.id, trigger.datasource, trigger.scope, trigger.scopeId, conditionsUpdate)
    }
  }

}
