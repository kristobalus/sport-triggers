import { Microfleet } from "@microfleet/core-types"

import { Redis } from "ioredis"

import { TriggerCollection } from "../../repositories/trigger.collection"
import { TriggerConditionCollection } from "../../repositories/trigger-condition.collection"
import { TriggerSubscriptionCollection } from "../../repositories/trigger-subscription.collection"
import { EssentialConditionData, EssentialTriggerData } from "../../models/dto/trigger-create-request"
import { TriggerWithConditions } from "../../models/dto/trigger-with-conditions"
import { EssentialSubscriptionData } from "../../models/dto/trigger-subscribe-request"
import { TriggerSubscription } from "../../models/entities/trigger-subscription"
import { metadata } from "../../models/events/event-metadata"

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

  async createTrigger(triggerData: EssentialTriggerData, conditionData: EssentialConditionData[]) {
    this.log.debug({ trigger: triggerData, conditions: conditionData }, "create trigger")

    const id = await this.triggers.add(triggerData)
    await this.conditions.add(id, triggerData.scope, triggerData.scopeId, conditionData)

    return id
  }

  async getTriggerListByEntity(
    entity: string,
    entityId: string,
    options: { trim?: boolean, showLog?: boolean } = {}): Promise<TriggerWithConditions[]> {
    const ids = await this.triggers.getListByEntity(entity, entityId)
    const items = []

    for (const id of ids) {
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

      items.push({ trigger, conditions } as TriggerWithConditions)
    }

    return items
  }

  async getSubscriptionListByEntity(entity: string, entityId: string): Promise<TriggerSubscription[]> {
    const ids = await this.subscriptions.getListByEntity(entity, entityId)
    const items = []

    for (const id of ids) {
      const item = await this.subscriptions.getOne(id)

      items.push(item)
    }

    return items
  }

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

  async subscribeTrigger(triggerId: string, data: EssentialSubscriptionData): Promise<string> {
    return this.subscriptions.create(triggerId, data)
  }

  async cancelSubscription(subscriptionId: string) {
    return this.subscriptions.deleteOne(subscriptionId)
  }

  async getTrigger(id: string): Promise<TriggerWithConditions> {
    const trigger = await this.triggers.getOne(id)
    const conditions = await this.conditions.getByTriggerId(id, { showLog: true })

    return { trigger, conditions } as TriggerWithConditions
  }

  getMetadata() {
    return metadata
  }
}
