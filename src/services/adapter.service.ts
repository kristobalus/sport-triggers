import { Microfleet } from "@microfleet/core-types"
// import { EventCollection } from "../repositories/event.collection"
import { Redis } from "ioredis"
import { TriggerConditionCollection } from "../repositories/trigger-condition.collection"
import { BaseEvent } from "../models/events/base.event"
import { TriggerCondition } from "../models/entities/trigger-condition"
import { AMQPTransport } from "@microfleet/transport-amqp"
import { TriggerSubscriptionCollection } from "../repositories/trigger-subscription.collection"
// import { TriggerCollection } from "../repositories/trigger.collection"
import { Trigger } from "../models/entities/trigger"

export class AdapterService {

  // private events: EventCollection
  private conditions: TriggerConditionCollection
  private subscriptions: TriggerSubscriptionCollection

  // private triggers: TriggerCollection

  constructor(
    private readonly log: Microfleet['log'],
    private readonly redis: Redis,
    private readonly amqp: AMQPTransport,
  ) {
    // this.triggers = new TriggerCollection(this.redis)
    this.conditions = new TriggerConditionCollection(this.redis)
    this.subscriptions = new TriggerSubscriptionCollection(this.redis)
  }

  isScopeMatched(trigger: Trigger, event: BaseEvent) {
    return trigger.scope === event.scope && trigger.scopeId === event.scopeId
  }

  async pushEvent(event: BaseEvent) {
    this.log.debug({ event }, `incoming event`)

    const triggers = await this.conditions.getTriggersByEvent(event.scope, event.scopeId, event.name)

    for (const triggerId of triggers) {
      const conditions = await this.conditions.get(triggerId)

      for (const condition of conditions) {
        if (condition.event === event.name) {
          if (condition.type === "set-and-compare") {
            // run lua script
            await this.setAndCompare(event, condition)

          } else if (condition.type === "incr-and-compare") {
            // run lua script
          } else {
            this.log.warn({ event }, `processing flow is not implemented`)
          }
        } // if condition event matched
      } // for each condition
    } // for each trigger subscribed
  }

  async setAndCompare(_event: BaseEvent, condition: TriggerCondition) {
    // run lua script
    const result = true
    if (result) {
      await this.notify(condition)
    }
  }

  async incrAndCompare(_event: BaseEvent, condition: TriggerCondition) {
    // run lua script
    const result = true
    if (result) {
      await this.notify(condition)
    }
  }

  async notify(condition: TriggerCondition) {
    const subscriptions = await this.subscriptions.getListByTrigger(condition.triggerId)
    for (const id of subscriptions) {
      const subscription = await this.subscriptions.getOne(id)
      const { route, payload } = subscription
      await this.amqp.publishAndWait(route, { ...payload })
    }
  }

}
