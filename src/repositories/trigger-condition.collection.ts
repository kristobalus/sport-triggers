import { randomUUID } from 'crypto'

import { Redis } from 'ioredis'
import { inPlaceSort } from 'fast-sort'
import { ArgumentError } from 'common-errors'

import { ChainOp, ConditionType, TriggerCondition } from '../models/entities/trigger-condition'
import { assertNoError, createArrayFromHGetAll } from '../utils/pipeline-utils'
import { Event } from '../models/events/event'
import { metadata } from '../models/events/event-metadata'
import { toUriByCondition } from '../models/events/uri'

export function conditionSetByTriggerKey(triggerId: string) {
  return `triggers/${triggerId}/conditions`
}

export function conditionKey(conditionId: string) {
  return `conditions/${conditionId}`
}

export function triggersByScopeAndEvent(scope: string, scopeId: string, eventName: string) {
  return `scopes/${scope}/${scopeId}/events/${eventName}/triggers`
}

export function conditionLogKey(conditionId: string) {
  return `conditions/${conditionId}/logs`
}

export class TriggerConditionCollection {
  constructor(
    private redis: Redis,
    private expiresInSeconds?: number
  ) {
  }

  async add(
    triggerId: string,
    scope: string,
    scopeId: string,
    conditions: Partial<TriggerCondition>[]) {
    if (conditions.length == 0) {
      throw new ArgumentError('Cannot create trigger without conditions')
    }

    // prefill data
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]

      if (!condition.triggerId) {
        condition.triggerId = triggerId
      } else if (condition.triggerId !== triggerId) {
        throw new ArgumentError('Owner conflict')
      }

      if (metadata[condition.event].params?.player) {
        if (!condition.params?.player) {
          throw new ArgumentError(`Condition for event ${condition.event} should have player parameter.`)
        }
      } else {
        if (condition.params?.player) {
          throw new ArgumentError(`Condition for event ${condition.event} should have no player parameter.`)
        }
      }

      if (metadata[condition.event].targets?.length > 0) {
        if (!metadata[condition.event].targets.includes(condition.target)) {
          throw new ArgumentError(`Condition for event ${condition.event} should `
            + `have target one of ${JSON.stringify(metadata[condition.event].targets)}.`)
        }
      }

      if (metadata[condition.event].compare?.length > 0) {
        if (!metadata[condition.event].compare.includes(condition.compare)) {
          throw new ArgumentError(`Condition for event ${condition.event} should `
            + `have compare one of ${JSON.stringify(metadata[condition.event].compare)}.`)
        }
      }

      if (!condition.id) {
        condition.id = randomUUID()
      }

      if (condition.type == ConditionType.SetAndCompare) {
        condition.current = '0'
      }

      if (condition.type == ConditionType.SetAndCompareAsString) {
        condition.current = ''
      }

      if (!condition.chainOperation) {
        condition.chainOperation = ChainOp.AND
      }

      condition.type = metadata[condition.event].type
      condition.scope = scope
      condition.scopeId = scopeId
      condition.chainOrder = i
      condition.uri = toUriByCondition(condition)

      if (condition.params) {
        condition.params = JSON.stringify(condition.params) as any
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
      condition.activated = (condition.activated as unknown as string) == '1'
      if (condition.params) {
        condition.params = JSON.parse(condition.params as any)
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

  getTriggerListByScopeAndEvent(
    scope: string,
    scopeId: string,
    eventName: string): Promise<string[]> {
    return this.redis.smembers(triggersByScopeAndEvent(scope, scopeId, eventName))
  }

  async appendToEventLog(conditionId: string, event: Event): Promise<boolean> {
    const logKey = conditionLogKey(conditionId)
    const result = await this.redis.hset(logKey, event.id, JSON.stringify(event))

    return result > 0
  }

  async getEventLog(conditionId: string): Promise<Event[]> {
    const log = await this.redis.hgetall(conditionLogKey(conditionId))
    const result = []

    for (const doc of Object.values(log)) {
      result.push(JSON.parse(doc))
    }
    inPlaceSort(result).asc('timestamp')

    return result
  }

  async cleanByTriggerId(triggerId: string) {
    const conditions = await this.getByTriggerId(triggerId)

    for (const item of conditions) {
      const pipe = this.redis.pipeline()

      if (this.expiresInSeconds) {
        pipe.expire(conditionSetByTriggerKey(triggerId), this.expiresInSeconds)
        pipe.expire(conditionKey(triggerId), this.expiresInSeconds)
        pipe.expire(conditionLogKey(item.id), this.expiresInSeconds)
      } else {
        pipe.del(conditionSetByTriggerKey(triggerId))
        pipe.del(conditionKey(item.id))
        pipe.del(conditionLogKey(item.id))
      }

      pipe.srem(triggersByScopeAndEvent(item.scope, item.scopeId, item.event), triggerId)

      await pipe.exec()
    }
  }
}

