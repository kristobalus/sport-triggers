import { Microfleet } from "@microfleet/core-types"

import { Redis } from "ioredis"

import { TriggerCollection } from "../repositories/trigger.collection"
import { TriggerConditionCollection } from "../repositories/trigger-condition.collection"
import { Trigger } from "../models/entities/trigger"
import { TriggerCondition } from "../models/entities/trigger-condition"
import { TriggerSubscriptionCollection } from "../repositories/trigger-subscription.collection"
import { TriggerSubscription } from "../models/entities/trigger-subscription"

export class StudioService {
  private triggers: TriggerCollection
  private conditions: TriggerConditionCollection
  private subscriptions: TriggerSubscriptionCollection

  constructor(
    private log: Microfleet['log'],
    private redis: Redis
  ) {
    this.triggers = new TriggerCollection(this.redis)
    this.conditions = new TriggerConditionCollection(this.redis)
    this.subscriptions = new TriggerSubscriptionCollection(this.redis)
  }

  async createTrigger(trigger: Partial<Trigger>, conditions: Partial<TriggerCondition>[]) {
    this.log.debug({ trigger, conditions }, "create trigger")

    const id = await this.triggers.add(trigger)

    await this.conditions.add(id, trigger.scope, trigger.scopeId, conditions)

    return id
  }

  async deleteTrigger(triggerId: string) {
    this.log.debug("delete trigger")
    await this.triggers.deleteOne(triggerId)
    await this.conditions.deleteByTriggerId(triggerId)
    await this.subscriptions.deleteByTriggerId(triggerId)
  }

  async subscribeTrigger(triggerId: string, data: Partial<TriggerSubscription>) {
    this.log.debug("subscribe for trigger")

    return this.subscriptions.create(triggerId, data)
  }

  async searchTriggers(_data: string) {
    this.log.debug("search for triggers by tags")
  }

  async unsubscribeTrigger(subscriptionId: string) {
    this.log.debug("cancel subscription")

    return this.subscriptions.deleteOne(subscriptionId)
  }
}
