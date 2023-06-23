import { randomUUID } from "crypto"

import { Redis } from "ioredis"
import { inPlaceSort } from "fast-sort"

import { ChainOp, ConditionType, TriggerCondition } from "../models/entities/trigger-condition"
import { assertNoError, createArrayFromHGetAll } from "../utils/pipeline-utils"
import { BaseEvent } from "../models/events/base.event"
import { metadata } from "../models/event-metadata"

export function conditionSetByTriggerKey(triggerId: string) {
  return `triggers/${triggerId}/conditions`
}

export function conditionKey(conditionId: string) {
  return `conditions/${conditionId}`
}

export function triggersByScopeAndEvent(scope: string, scopeId: string, eventName: string) {
  return `events/${scope}/${scopeId}/${eventName}/triggers`
}

export function conditionLogKey(conditionId: string) {
  return `conditions/${conditionId}/logs`
}

export class TriggerConditionCollection {
  constructor(
    private redis: Redis
  ) {}

  async add(triggerId: string, scope: string, scopeId: string, conditions: Partial<TriggerCondition>[]) {
    if ( conditions.length == 0 ) {
      return
    }

    // TODO consider if we should keep or clean old conditions?
    await this.deleteByTriggerId(triggerId)

    // prefill data
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]

      if ( !condition.id ) {
        condition.id = randomUUID()
      }
      if ( !condition.triggerId ) {
        condition.triggerId = triggerId
      } else if ( condition.triggerId !== triggerId ) {
        throw new Error("Condition owner conflict")
      }

      condition.type = metadata[condition.event].type

      if ( condition.type == ConditionType.SetAndCompare ) {
        condition.current = 0
      }

      if ( condition.type == ConditionType.SetAndCompareAsString ) {
        condition.current = ""
      }

      condition.scope = scope
      condition.scopeId = scopeId
      condition.chainOrder = i

      if ( !condition.chainOperation ) {
        condition.chainOperation = ChainOp.AND
      }
    }

    const pipe = this.redis.pipeline()

    for (const condition of conditions) {
      pipe.hmset(conditionKey(condition.id), condition)
      // should add condition into list of trigger conditions
      pipe.sadd(conditionSetByTriggerKey(condition.triggerId), condition.id)
      // should add trigger into list of event subscribers
      pipe.sadd(triggersByScopeAndEvent(scope, scopeId, condition.event), triggerId)
    }

    const results = await pipe.exec()

    assertNoError(results)
  }

  async getByTriggerId(triggerId: string, options: { showLog?: boolean } = {}): Promise<TriggerCondition[]> {
    const ids = await this.redis.smembers(conditionSetByTriggerKey(triggerId))
    const pipe = this.redis.pipeline()

    for (const id of ids) {
      pipe.hgetall(conditionKey(id))
    }

    const results = await pipe.exec()
    const conditions = createArrayFromHGetAll(results) as TriggerCondition[]

    for (const condition of conditions) {
      condition.chainOrder = parseInt(condition.chainOrder as unknown as string)
      condition.activated = (condition.activated as unknown as string) == "1"
      if ( condition.type == ConditionType.SetAndCompare ) {
        condition.current = parseFloat(condition.current as string)
        condition.target = parseFloat(condition.target as string)
      }
      if (options.showLog) {
        condition.log = await this.getEventLog(condition.id)
      }
    }

    inPlaceSort(conditions).asc('chainOrder')

    return conditions
  }

  async deleteByTriggerId(triggerId: string) {
    const conditions = await this.getByTriggerId(triggerId)

    for (const item of conditions) {
      await this.redis.del(conditionKey(item.id))
      await this.redis.del(conditionLogKey(item.id))
      await this.redis.srem(conditionSetByTriggerKey(triggerId), item.id)
      await this.redis.srem(triggersByScopeAndEvent(item.scope, item.scopeId, item.event), triggerId)
    }
  }

  async findTriggersByScopeAndEvent(scope: string, scopeId: string, eventName: string): Promise<string[]> {
    return this.redis.smembers(triggersByScopeAndEvent(scope, scopeId, eventName))
  }

  async appendToEventLog(conditionId: string, event: BaseEvent): Promise<boolean> {
    const logKey = conditionLogKey(conditionId)
    const result = await this.redis.hset(logKey, event.id, JSON.stringify(event))
    return result > 0
  }

  async getEventLog(conditionId: string): Promise<BaseEvent[]> {
    const log = await this.redis.hgetall(conditionLogKey(conditionId))
    const result = []

    for (const doc of Object.values(log)) {
      result.push(JSON.parse(doc))
    }
    inPlaceSort(result).asc('timestamp')

    return result
  }
}

