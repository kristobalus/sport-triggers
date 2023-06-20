import { Microfleet } from "@microfleet/core-types"

import { Redis } from "ioredis"

import { TriggerCollection } from "../repositories/trigger.collection"
import { TriggerConditionCollection } from "../repositories/trigger-condition.collection"
import { Trigger } from "../models/entities/trigger"
import { TriggerCondition } from "../models/entities/trigger-condition"

export class StudioService {
  private triggers: TriggerCollection
  private conditions: TriggerConditionCollection

  constructor(
    private log: Microfleet['log'],
    private redis: Redis
  ) {
    this.triggers = new TriggerCollection(this.redis)
    this.conditions = new TriggerConditionCollection(this.redis)
  }

  async createTrigger(trigger: Partial<Trigger>, conditions: Partial<TriggerCondition>[]) {
    this.log.debug({ trigger, conditions }, "create trigger")

    const id = await this.triggers.add(trigger)

    await this.conditions.add(id, trigger.scope, trigger.scopeId, conditions)

    return id
  }

  async deleteTrigger(_data) {
    this.log.debug("delete trigger")
  }

  async subscribeTrigger(_data) {
    this.log.debug("subscribe for trigger")
  }

  async unsubscribeTrigger(_data) {
    this.log.debug("unsubscribe from trigger")
  }

  async getTriggerList(_data) {
    this.log.debug("get list of triggers")
  }
}
