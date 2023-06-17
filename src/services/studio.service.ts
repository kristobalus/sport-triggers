import { Microfleet } from "@microfleet/core-types"

import { Redis } from "ioredis"

import { TriggerCollection } from "../repositories/trigger.collection"
import { TriggerConditionCollection } from "../repositories/trigger-condition.collection"
import { Trigger } from "../models/entities/trigger"

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

  async createTrigger(data: Partial<Trigger>) {
    this.log.debug({ data }, "create trigger")

    const id = await this.triggers.add(data)
    const { conditions } = data

    await this.conditions.add(id, data.scope, data.scopeId, conditions)

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
