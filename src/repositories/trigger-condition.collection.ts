import { randomUUID } from "crypto"

import { Redis } from "ioredis"

import { TriggerCondition } from "../models/entities/trigger-condition"
import { assertNoError, createArrayFromHGetAll } from "../utils/pipeline-utils"

export function conditionsByTriggerKey(triggerId: string) {
  return `triggers/${triggerId}/conditions`
}

export function triggersByEvent(eventName: string) {
  return `event/${eventName}/triggers`
}

export function conditionKey(conditionId: string) {
  return `conditions/${conditionId}`
}

export function triggersByScopeAndEvent(scope: string, scopeId: string, eventName: string) {
  return `events/${scope}/${scopeId}/${eventName}/triggers`
}

export class TriggerConditionCollection {
  constructor(
    private redis: Redis
  ) {}

  async add(triggerId: string, scope: string, scopeId: string, conditions: Partial<TriggerCondition>[]) {
    if ( conditions.length == 0 ) {
      return
    }

    await this.delete(triggerId)

    for (const condition of conditions ) {
      if ( !condition.id ) {
        condition.id = randomUUID()
      }
      if ( !condition.triggerId ) {
        condition.triggerId = triggerId
      } else if ( condition.triggerId !== triggerId ) {
        throw new Error("Condition owner conflict")
      }
      condition.scope = scope
      condition.scopeId = scopeId
    }

    const pipe = this.redis.pipeline()

    for (const condition of conditions) {
      pipe.hmset(conditionKey(condition.id), condition)
      // should add condition into list of trigger conditions
      pipe.sadd(conditionsByTriggerKey(condition.triggerId), condition.id)
      // should add trigger into list of event subscribers
      pipe.sadd(triggersByScopeAndEvent(scope, scopeId, condition.event), triggerId)
    }

    const results = await pipe.exec()
    assertNoError(results)
  }

  async getByTrigger(triggerId: string): Promise<TriggerCondition[]> {
    const conditions = await this.redis.smembers(conditionsByTriggerKey(triggerId))
    const pipe = this.redis.pipeline()

    for (const id of conditions) {
      pipe.hgetall(conditionKey(id))
    }
    const results = await pipe.exec()

    return createArrayFromHGetAll(results)
  }

  async delete(triggerId: string) {
    const conditions = await this.getByTrigger(triggerId)

    for (const item of conditions) {
      await this.redis.del(conditionKey(item.id))
      await this.redis.srem(conditionsByTriggerKey(triggerId), item.id)
      await this.redis.srem(triggersByScopeAndEvent(item.scope, item.scopeId, item.event), triggerId)
    }
  }

  async findTriggersByScopeAndEvent(scope: string, scopeId: string, eventName: string) : Promise<string[]> {
    return this.redis.smembers(triggersByScopeAndEvent(scope, scopeId, eventName))
  }

}

