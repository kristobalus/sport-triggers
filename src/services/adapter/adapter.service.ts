import { Microfleet } from "@microfleet/core-types"
import { AMQPTransport } from "@microfleet/transport-amqp"

import { Redis } from "ioredis"

import { conditionKey, TriggerConditionCollection } from "../../repositories/trigger-condition.collection"
import { BaseEvent } from "../../models/events/base.event"
import { ChainOp, ConditionType, TriggerCondition } from "../../models/entities/trigger-condition"
import { TriggerSubscriptionCollection } from "../../repositories/trigger-subscription.collection"
import { TriggerCollection } from "../../repositories/trigger.collection"

export class AdapterService {
  private conditionCollection: TriggerConditionCollection
  private subscriptionCollection: TriggerSubscriptionCollection
  private triggerCollection: TriggerCollection

  constructor(
    private readonly log: Microfleet['log'],
    private readonly redis: Redis,
    private readonly amqp: AMQPTransport
  ) {
    this.triggerCollection = new TriggerCollection(this.redis)
    this.conditionCollection = new TriggerConditionCollection(this.redis)
    this.subscriptionCollection = new TriggerSubscriptionCollection(this.redis)
  }

  async pushEvent(event: BaseEvent) {
    this.log.debug({ event }, `incoming event`)

    const { scope, scopeId, name } = event
    const triggers = await this.conditionCollection.findTriggersByScopeAndEvent(scope, scopeId, name)

    for (const triggerId of triggers) {

      const conditions = await this.conditionCollection.getByTriggerId(triggerId)

      for (const condition of conditions) {
        if (condition.activated) continue
        if (condition.event === event.name) {
          await this.evaluateCondition(event, condition)
        }
      }

      let triggerResult = conditions.length > 0

      for (const condition of conditions) {
        if (condition.chainOperation == ChainOp.AND) {
          triggerResult = (triggerResult && condition.activated)
        } else if (condition.chainOperation == ChainOp.OR) {
          triggerResult = (triggerResult || condition.activated)
        }
      }

      if (triggerResult) {
        // TODO is it redundant?
        await this.triggerCollection.updateOne(triggerId, { activated: true })

        await this.notify(triggerId)

        await this.triggerCollection.deleteOne(triggerId)
        await this.conditionCollection.deleteByTriggerId(triggerId)
        await this.subscriptionCollection.deleteByTriggerId(triggerId)
      }
    }
  }

  private async evaluateCondition(event: BaseEvent, condition: TriggerCondition) {
    this.log.debug({ event, condition }, `evaluating trigger condition`)
    if (condition.type === ConditionType.SetAndCompare) {

      await this.setAndCompare(event, condition)

    } else if (condition.type === ConditionType.SetAndCompareAsString) {

      await this.setAndCompareAsString(event, condition)

    } else if (condition.type === ConditionType.IncrAndCompare) {

      await this.incrAndCompare(event, condition)
    } else {

      this.log.fatal({ event }, `processing flow is not implemented`)
    }
  }

  private async setAndCompare(event: BaseEvent, condition: TriggerCondition) {
    const key = conditionKey(condition.id)
    const current = event.value as number

    try {
      const [ activated, append ] = await this.redis.set_and_compare(1, key, current)
      condition.activated = !!activated

      if ( append ) {
        condition.current = current
        await this.conditionCollection.appendToEventLog(condition.id, event)
      }
      this.log.debug({ condition }, `evaluation result`)
    } catch (err) {
      this.log.fatal({ err , key, current }, 'failed to compare')
    }

    return condition.activated
  }

  private async setAndCompareAsString(event: BaseEvent, condition: TriggerCondition) {
    const key = conditionKey(condition.id)
    const current = event.value as string

    try {
      const [ result, append ] = await this.redis.set_and_compare_as_string(1, key, current)
      condition.activated = !!result

      if ( append ){
        await this.conditionCollection.appendToEventLog(condition.id, event)
      }

      this.log.debug({ condition }, `evaluation result`)

    } catch (err) {
      this.log.fatal({ err, key, value: current }, "failed to compare")
    }

    return condition.activated
  }

  private async incrAndCompare(_event: BaseEvent, _condition: TriggerCondition) {
    // run lua script
  }

  private async notify(triggerId: string) {
    const ids = await this.subscriptionCollection.getListByTrigger(triggerId)

    for (const id of ids) {
      const subscription = await this.subscriptionCollection.getOne(id)
      const { route, payload, options } = subscription

      await this.amqp.publishAndWait(route, { ...payload }, { ...options })
      this.log.debug({ route, payload, options, triggerId, subscriptionId: id }, `message sent`)
    }
  }
}
