import { Microfleet } from "@microfleet/core-types"
import { AMQPTransport } from "@microfleet/transport-amqp"

import { Redis } from "ioredis"

import { conditionKey, TriggerConditionCollection } from "../repositories/trigger-condition.collection"
import { BaseEvent } from "../models/events/base.event"
import { ChainOp, ConditionTypes, TriggerCondition } from "../models/entities/trigger-condition"
import { TriggerSubscriptionCollection } from "../repositories/trigger-subscription.collection"
import { TriggerCollection } from "../repositories/trigger.collection"

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

  async pushEvent(event: BaseEvent) {
    this.log.debug({ event }, `incoming event`)

    const { scope, scopeId, name } = event
    const triggers = await this.conditions.findTriggersByScopeAndEvent(scope, scopeId, name)

    for (const triggerId of triggers) {
      const conditions = await this.conditions.getByTriggerId(triggerId)

      for (const condition of conditions) {
        if (condition.event === event.name) {
          await this.evaluateCondition(event, condition)
        }
      }

      let triggerResult = true

      for (const condition of conditions) {
        if (condition.chainOperation == ChainOp.AND) {
          triggerResult = (triggerResult && condition.activated)
        } else if (condition.chainOperation == ChainOp.OR) {
          triggerResult = (triggerResult || condition.activated)
        }
      }

      if (triggerResult) {
        const trigger = await this.triggers.getOneById(triggerId)

        trigger.activated = true
        await this.triggers.updateOne(triggerId, { activated: true })
        await this.notify(triggerId)

        await this.triggers.deleteOne(triggerId)
        await this.conditions.deleteByTriggerId(triggerId)
        await this.subscriptions.deleteByTriggerId(triggerId)
      }
    }
  }

  private async evaluateCondition(event: BaseEvent, condition: TriggerCondition) {
    if (condition.type === ConditionTypes.SetAndCompare) {
      await this.setAndCompare(event, condition)
    } else if (condition.type === ConditionTypes.SetAndCompareAsString) {
      await this.setAndCompareAsString(event, condition)
    } else if (condition.type === ConditionTypes.IncrAndCompare) {
      await this.incrAndCompare(event, condition)
    } else {
      this.log.fatal({ event }, `processing flow is not implemented`)
    }
  }

  private async setAndCompare(event: BaseEvent, condition: TriggerCondition) {
    const key = conditionKey(condition.id)
    const value = event.value as number

    const result = await this.redis.set_and_compare(key, value)

    condition.activated = !!result

    await this.conditions.appendToEventLog(condition.id, event)

    return result
  }

  private async setAndCompareAsString(event: BaseEvent, condition: TriggerCondition) {
    const key = conditionKey(condition.id)
    const value = event.value as string

    const result = await this.redis.set_and_compare_as_string(key, value)

    condition.activated = !!result

    await this.conditions.appendToEventLog(condition.id, event)

    return result
  }

  private async incrAndCompare(_event: BaseEvent, _condition: TriggerCondition) {
    // run lua script
  }

  private async notify(triggerId: string) {
    const subscriptions = await this.subscriptions.getListByTrigger(triggerId)

    for (const id of subscriptions) {
      const subscription = await this.subscriptions.getOne(id)
      const { route, payload } = subscription

      await this.amqp.publishAndWait(route, { ...payload })
    }
  }
}
