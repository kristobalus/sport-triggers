import { Microfleet } from '@microfleet/core-types'

import assert from 'assert'

import { Redis } from 'ioredis'
import { ArgumentError } from 'common-errors'

import { TriggerCollection } from '../../repositories/trigger.collection'
import { TriggerConditionCollection } from '../../repositories/trigger-condition.collection'
import { TriggerSubscriptionCollection } from '../../repositories/trigger-subscription.collection'
import { EssentialConditionData, EssentialTriggerData } from '../../models/dto/trigger-create-request'
import { TriggerWithConditions } from '../../models/dto/trigger-with-conditions'
import { EssentialSubscriptionData } from '../../models/dto/trigger-subscribe-request'
import { TriggerSubscription } from '../../models/entities/trigger-subscription'
import { Trigger } from '../../models/entities/trigger'
import { TriggerCondition } from '../../models/entities/trigger-condition'
import { TriggerLimitCollection } from "../../repositories/trigger-limit.collection"
import { EntityLimitCollection } from "../../repositories/entity-limit.collection"

export interface TriggerOptions {
  showLog?: boolean
  trim?: boolean
}

export interface StudioServiceOptions {
  log: Microfleet['log']
  redis: Redis
  triggerCollection: TriggerCollection
  conditionCollection: TriggerConditionCollection
  subscriptionCollection: TriggerSubscriptionCollection
  triggerLimitCollection: TriggerLimitCollection
  entityLimitCollection: EntityLimitCollection
}

export class StudioService {
  private log: Microfleet['log']
  private triggerCollection: TriggerCollection
  private triggerConditionCollection: TriggerConditionCollection
  private subscriptionCollection: TriggerSubscriptionCollection
  private triggerLimitCollection: TriggerLimitCollection
  private entityLimitCollection: EntityLimitCollection

  constructor(options: StudioServiceOptions) {
    this.log = options.log
    this.triggerCollection = options.triggerCollection
    this.triggerConditionCollection = options.conditionCollection
    this.subscriptionCollection = options.subscriptionCollection
    this.triggerLimitCollection = options.triggerLimitCollection
    this.entityLimitCollection = options.entityLimitCollection
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
   * @param limits
   * @return triggerId
   */
  async createTrigger(
    triggerData: EssentialTriggerData,
    conditionData: EssentialConditionData[],
    limits?: Record<string, number>
  ) : Promise<string> {
    this.log.debug({
      trigger: triggerData,
      conditions: conditionData,
      limits: limits
    }, 'create trigger')

    let triggerId

    try {
      triggerId = await this.triggerCollection.add(triggerData)
    } catch (err) {
      this.log.fatal({ err }, 'failed to create trigger instance')

      throw new ArgumentError('failed to create trigger', err)
    }

    try {

      await this.triggerConditionCollection.add(
        triggerId,
        triggerData.datasource,
        triggerData.sport,
        triggerData.scope,
        triggerData.scopeId,
        conditionData)


    } catch (err) {
      if (triggerId) {
        await this.triggerCollection.deleteOne(triggerId)
        await this.triggerConditionCollection.deleteByTriggerId(triggerId)
      }

      this.log.fatal({ err }, 'failed to create condition instance')

      throw new ArgumentError('failed to create trigger condition', err)
    }

    if ( limits  ) {
      try {
        await this.triggerLimitCollection.setLimits(triggerId, limits)
      } catch (err) {
        if (triggerId) {
          await this.triggerCollection.deleteOne(triggerId)
          await this.triggerConditionCollection.deleteByTriggerId(triggerId)
          await this.triggerLimitCollection.deleteByTriggerId(triggerId)
        }

        this.log.fatal({ err }, 'failed to create limits')

        throw new ArgumentError('failed to create trigger', err)
      }
    }

    this.log.debug({
      triggerId,
      trigger: triggerData,
      conditions: conditionData,
      limits: limits
    }, 'trigger created')

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
    const ids = await this.triggerCollection.getListByEntity(entity, entityId)
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
    const ids = await this.triggerCollection.getListByScope(datasource, scope, scopeId)
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
    const ids = await this.subscriptionCollection.getListByEntity(entity, entityId)
    const items = []

    for (const id of ids) {
      const item = await this.subscriptionCollection.getOne(id)

      items.push(item)
    }

    return items
  }

  /**
   * @description returns a list of subscriptions for a trigger activation
   */
  async getSubscriptionListByTrigger(triggerId: string): Promise<TriggerSubscription[]> {
    const ids = await this.subscriptionCollection.getListByTrigger(triggerId)
    const items = []

    for (const id of ids) {
      const item = await this.subscriptionCollection.getOne(id)

      items.push(item)
    }

    return items
  }

  async deleteTrigger(triggerId: string) {
    const trigger = await this.triggerCollection.getOne(triggerId)
    // TODO change for checking statistics
    if ( trigger && !trigger.activated ) {
      await this.triggerCollection.deleteOne(triggerId)
      await this.triggerConditionCollection.deleteByTriggerId(triggerId)
      await this.subscriptionCollection.deleteByTriggerId(triggerId)
    }
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
  async subscribeTrigger(triggerId: string, data: EssentialSubscriptionData): Promise<string> {
    return this.subscriptionCollection.create(triggerId, data)
  }

  /**
   * @description cancels existing subscription for trigger
   */
  cancelSubscription(subscriptionId: string) {
    return this.subscriptionCollection.deleteOne(subscriptionId)
  }

  /**
   * @description returns trigger along with conditions,
   *              option "showLog" attaches event log to conditions
   *              options "trim" removes redundant information to reduce response size
   */
  async getTrigger(triggerId: string, options: TriggerOptions = {}): Promise<TriggerWithConditions> {
    const trigger = await this.triggerCollection.getOne(triggerId)
    const conditions = await this.triggerConditionCollection.getByTriggerId(triggerId, { showLog: options.showLog })
    const limits = await this.triggerLimitCollection.getLimits(triggerId)
    const counts = await this.triggerLimitCollection.getCounts(triggerId)

    if (options.trim) {
      for (const condition of conditions) {
        condition.scopeId = undefined
        condition.scope = undefined
        condition.triggerId = undefined
        condition.type = undefined
      }
    }

    return { trigger, conditions, limits, counts } as TriggerWithConditions
  }

  async updateTrigger(
    triggerUpdate: Partial<Trigger>,
    conditionsUpdate: Partial<TriggerCondition>[] = [],
    limits?: Record<string, number>) {

    assert(triggerUpdate.id)
    const trigger = await this.triggerCollection.getOne(triggerUpdate.id)

    assert(trigger)

    // update trigger
    await this.triggerCollection.updateOne(triggerUpdate.id, triggerUpdate)

    // diff clean up obsolete conditions (which are present in db but not present in update)
    const updatedIds = conditionsUpdate.map(v => v.id).filter(id => id !== undefined)
    const currentIds = await this.triggerConditionCollection.getListByTriggerId(triggerUpdate.id)

    for (const id of currentIds) {
      if ( updatedIds.indexOf(id) == -1 ) {
        await this.triggerConditionCollection.deleteById(id)
      }
    }

    if ( conditionsUpdate.length ) {
      // update or create conditions
      await this.triggerConditionCollection.add(trigger.id, trigger.datasource, trigger.sport, trigger.scope, trigger.scopeId, conditionsUpdate)
    }

    if (limits) {
      await this.triggerLimitCollection.setLimits(trigger.id, limits)
    }
  }

  async enableTrigger(triggerId: string) {
    assert(triggerId)

    const trigger = await this.triggerCollection.getOne(triggerId)

    assert(trigger)

    await this.triggerCollection.updateOne(triggerId, { disabled: false })
  }

  async disableTrigger(triggerId: string) {
    assert(triggerId)

    const trigger = await this.triggerCollection.getOne(triggerId)

    assert(trigger)

    await this.triggerCollection.updateOne(triggerId, { disabled: true })
  }

  async setTriggerLimits(triggerId: string, limits: Record<string, number | string>) : Promise<boolean> {
    await this.triggerLimitCollection.setLimits(triggerId, limits)
    return true
  }

  async setEntityLimits(entity: string, entityId: string, limits: Record<string, number | string>) : Promise<boolean> {
    await this.entityLimitCollection.setLimits(entity, entityId, limits)
    return true
  }

  async getEntityLimits(entity: string, entityId: string) : Promise<Record<string, number>> {
    return await this.entityLimitCollection.getLimits(entity, entityId)
  }

  async disableEntity(entity: string, entityId: string) {
    const triggerIds = await this.triggerCollection.getListByEntity(entity, entityId)

    for(const triggerId of triggerIds) {
      const trigger = await this.triggerCollection.getOne(triggerId)
      await this.triggerCollection.updateOne(trigger.id, { disabledEntity: true })
    }
  }

  async enableEntity(entity: string, entityId: string) {
    const triggerIds = await this.triggerCollection.getListByEntity(entity, entityId)

    for(const triggerId of triggerIds) {
      const trigger = await this.triggerCollection.getOne(triggerId)
      await this.triggerCollection.updateOne(trigger.id, { disabledEntity: false })
    }
  }

}
