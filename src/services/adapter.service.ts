import { Microfleet } from "@microfleet/core-types"
// import { EventCollection } from "../repositories/event.collection"
import { Redis } from "ioredis"
import { conditionKey, TriggerConditionCollection } from "../repositories/trigger-condition.collection"
import { BaseEvent } from "../models/events/base.event"
import { TriggerCondition } from "../models/entities/trigger-condition"
import { AMQPTransport } from "@microfleet/transport-amqp"
import { TriggerSubscriptionCollection } from "../repositories/trigger-subscription.collection"
import { TriggerCollection } from "../repositories/trigger.collection"
import { Trigger } from "../models/entities/trigger"

export class AdapterService {

  private conditions: TriggerConditionCollection
  private subscriptions: TriggerSubscriptionCollection
  private triggers: TriggerCollection

  constructor(
    private readonly log: Microfleet['log'],
    private readonly redis: Redis,
    private readonly amqp: AMQPTransport,
  ) {
    this.triggers = new TriggerCollection(this.redis)
    this.conditions = new TriggerConditionCollection(this.redis)
    this.subscriptions = new TriggerSubscriptionCollection(this.redis)
  }

  // private isScopeMatched(trigger: Trigger, event: BaseEvent) {
  //   return trigger.scope === event.scope && trigger.scopeId === event.scopeId
  // }

  async pushEvent(event: BaseEvent) {
    this.log.debug({ event }, `incoming event`)

    const { scope, scopeId, name } = event
    const triggers = await this.conditions.findTriggersByScopeAndEvent(scope, scopeId, name)

    for (const triggerId of triggers) {
      const trigger = await this.triggers.getOneById(triggerId)
      const conditions = await this.conditions.getByTriggerId(triggerId)

      for (const condition of conditions) {
        if (condition.event === event.name) {
          if (condition.type === "set_and_compare") {
            await this.setAndCompare(event, condition)
          }
          else if (condition.type === "set_and_compare_as_string") {
            await this.setAndCompareAsString(event, condition)
          }
          else if (condition.type === "incr_and_compare") {
            await this.incrAndCompare(event, trigger, condition)
          } else {
            this.log.fatal({ event }, `processing flow is not implemented`)
          }
        } // if condition event matched
      } // for each condition
    } // for each trigger subscribed
  }

  private async setAndCompare(event: BaseEvent, condition: TriggerCondition) {
    const key = conditionKey(condition.id)
    const value = event.value as number

    const result = await this.redis.set_and_compare(key, value)
    await this.conditions.appendToEventLog(condition.id, event)

    return result
  }

  private async setAndCompareAsString(event: BaseEvent, condition: TriggerCondition) {
    const key = conditionKey(condition.id)
    const value = event.value as string

    const result = await this.redis.set_and_compare_as_string(key, value)
    await this.conditions.appendToEventLog(condition.id, event)

    return result
  }

  private async incrAndCompare(_event: BaseEvent, trigger: Trigger, condition: TriggerCondition) {
    // run lua script
    const result = true
    if (result) {
      await this.notify(trigger, condition)
    }
  }

  private async notify(_trigger: Trigger, condition: TriggerCondition) {
    const subscriptions = await this.subscriptions.getListByTrigger(condition.triggerId)
    console.log(`should notify`, subscriptions)

    for (const id of subscriptions) {
      const subscription = await this.subscriptions.getOne(id)
      const { route, payload } = subscription
      await this.amqp.publishAndWait(route, { ...payload })
    }
  }

}
