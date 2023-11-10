import { randomUUID } from 'crypto'

import { Redis } from 'ioredis'
import { inPlaceSort } from 'fast-sort'
import { ArgumentError } from 'common-errors'

import { ChainOp, ConditionType, TriggerCondition, TriggerConditionOption } from '../models/entities/trigger-condition'
import { assertNoError, createArrayFromHGetAll } from '../utils/pipeline-utils'
import { metadata as basketballMeta } from '../sports/basketball/metadata'
import { metadata as baseballMeta } from '../sports/baseball/metadata'
import { metadata as footballMeta } from '../sports/football/metadata'
import * as EventUri from '../models/events/event-uri'

const metadata = {
  ...basketballMeta,
  ...baseballMeta,
  ...footballMeta,
}

export function conditionSetByTriggerKey(triggerId: string) {
  return `triggers/${triggerId}/conditions`
}

export function conditionKey(conditionId: string) {
  return `conditions/${conditionId}`
}

/**
 * @description trigger id set subscribed to scope and event
 */
export function subscribedToScopeAndEvent(datasource: string, scope: string, scopeId: string, eventName: string) {
  return `subscribers/scope/${datasource}/${scope}/${scopeId}/events/${eventName}/triggers`
}

/**
 * @description trigger id set subscribe to uri
 */
export function subscribedToUri(uri: string) {
  return `subscribers/uri/${uri}/triggers`
}

export function conditionLogKey(conditionId: string) {
  return `conditions/${conditionId}/log`
}

function intersection(array1: any[], array2: any[]): any[] {
  const result = []

  for (const e1 of array1) {
    if (array2.indexOf(e1) > -1) {
      result.push(e1)
    }
  }

  return result
}

export function validateCondition(
  condition: Partial<TriggerCondition>,
) {
  if (!metadata[condition.event]) {
    throw new ArgumentError(`metadata not defined for event ${condition.event}`)
  }

  if (!condition?.targets?.length) {
    throw new ArgumentError('Condition targets should be defined')
  }

  const meta = metadata[condition.event]

  condition.targets = condition.targets.map(target => target.toString())
  condition.type = meta.type

  if (condition.type == ConditionType.Number) {
    condition.current = '0'
  }

  if (condition.type == ConditionType.String) {
    condition.current = ''
  }

  // checking allowed targets, if any restricted
  if (meta.targets?.length > 0) {
    const mutual = intersection(condition.targets, meta.targets)

    if (mutual.length == 0) {
      throw new ArgumentError(`Condition for event ${condition.event} should `
        + `have target one of ${JSON.stringify(meta.targets)}.`)
    }
  }

  // checking allowed compare operations, if any restricted
  if (meta.compare?.length > 0) {
    if (!meta.compare.includes(condition.compare)) {
      throw new ArgumentError(`Condition for event ${condition.event} should `
        + `have compare one of ${JSON.stringify(meta.compare)}.`)
    }
  }

  // TODO aggregation is disabled in condition and left for option
  //  the logic is: condition determines the scope, option aggregates within scope
  // if (meta.aggregate) {
  //   if ( condition.aggregateTargets?.length ) {
  //     const { datasource, scopeId, aggregateTargets } = condition
  //     condition.aggregate = meta.aggregate(datasource, scopeId, aggregateTargets)
  //   }
  // }

  if (!condition.options) {
    condition.options = []
  } else {
    condition.options.forEach(option => validateOption(option, condition))
  }

  if(condition.chainOperation === ChainOp.OR) {
    throw new ArgumentError(`Condition OR chaining operation not allowed.`)
  }
}

export function validateOption(
  option: Partial<TriggerConditionOption>,
  // parent condition
  condition: Partial<TriggerCondition>,
) {
  if (!metadata[option.event]) {
    throw new ArgumentError(`Metadata not defined for event ${option.event}`)
  }

  const meta = metadata[option.event]

  if (meta.optionScope && !meta.optionScope.includes(condition.event)) {
    throw new ArgumentError(`Event ${option.event} can be used as option for ${JSON.stringify(meta.optionScope)} only.`)
  }

  if (!option.targets?.length) {
    if (meta.inferTargetsFromScope) {
      option.targets = [...condition.targets]
    }
  }

  if (!option.targets?.length) {
    throw new ArgumentError('No default event found. Option targets should be defined')
  }

  // checking allowed targets, if any restricted
  if (meta.targets?.length > 0) {
    const mutual = intersection(option.targets, meta.targets)

    if (mutual.length == 0) {
      throw new ArgumentError(`Option for event ${option.event} should `
        + `have target one of ${JSON.stringify(meta.targets)}.`)
    }
  }

  // checking allowed compare operations, if any restricted
  if (meta.compare?.length > 0) {
    if (!meta.compare.includes(option.compare)) {
      throw new ArgumentError(`Option for event ${option.event} should `
        + `have compare one of ${JSON.stringify(meta.compare)}.`)
    }
  }

  option.type = meta.type

  if (!option.compare) {
    if ( meta.optionDefaultCompare ) {
      option.compare = meta.optionDefaultCompare
    }
  }

  if (meta.aggregate) {
    if (!meta.optionScope) {
      throw new ArgumentError(`Metadata optionScope should be defined for ${option.event} for aggregation`)
    }
    const { datasource, sport, scope, scopeId, targets } = condition

    option.aggregate = meta.aggregate(datasource, sport, scope, scopeId, targets)
  }
}

export class TriggerConditionCollection {
  constructor(
    private redis: Redis,
    private expiresInSeconds?: number,
  ) {
  }

  async add(
    triggerId: string,
    datasource: string,
    sport: string,
    scope: string,
    scopeId: string,
    conditions: Partial<TriggerCondition>[]) {
    if (!conditions || conditions.length == 0) {
      throw new ArgumentError('Cannot create trigger without conditions')
    }

    // prefill and validate data
    const items: TriggerCondition[] = []

    for (let i = 0; i < conditions.length; i++) {
      const condition = { ...conditions[i] } as TriggerCondition

      if (!condition.id) {
        condition.id = randomUUID()
      }
      condition.datasource = datasource
      condition.scope = scope
      condition.sport = sport
      condition.scopeId = scopeId
      condition.uri = EventUri.getUriFromCondition(condition)

      validateCondition(condition)

      if (!condition.triggerId) {
        condition.triggerId = triggerId
      } else if (condition.triggerId !== triggerId) {
        throw new ArgumentError('Owner conflict')
      }

      condition.chainOrder = i
      if (!condition.chainOperation) {
        condition.chainOperation = ChainOp.AND
      }

      condition.options = JSON.stringify(condition.options) as any
      condition.targets = JSON.stringify(condition.targets) as any

      items.push(condition)
    }

    const pipe = this.redis.pipeline()

    for (const condition of items) {
      pipe.hmset(conditionKey(condition.id), condition)
      // should add condition into list of trigger conditions
      pipe.sadd(conditionSetByTriggerKey(condition.triggerId), condition.id)
      // should add trigger into list of event subscribers
      pipe.zadd(subscribedToScopeAndEvent(datasource, scope, scopeId, condition.event), Date.now(), triggerId)
      // should add trigger into list of uri subscribers
      pipe.zadd(subscribedToUri(condition.uri), Date.now(), triggerId)
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
      await this.afterRead(condition, options?.showLog)
    }

    inPlaceSort(conditions).asc('chainOrder')

    return conditions
  }

  async getById(id: string, options: { showLog?: boolean } = {}): Promise<TriggerCondition> {
    const condition = await this.redis.hgetall(conditionKey(id))

    await this.afterRead(condition, options?.showLog)

    return condition as unknown as TriggerCondition
  }

  async update(id: string, updated: Partial<TriggerCondition>) {
    const data = { ...updated } as any

    if (data.activated !== undefined ){
      data.activated = data.activated == 1 || data.activated == "1" || data.activated == "true" ? 1 : 0
    }

    await this.redis.hmset(conditionKey(id), data)
  }

  async deleteByTriggerId(triggerId: string) {
    const conditions = await this.getByTriggerId(triggerId)
    const pipe = this.redis.pipeline()

    for (const condition of conditions) {
      pipe.del(conditionKey(condition.id))
      pipe.del(conditionLogKey(condition.id))
      pipe.srem(conditionSetByTriggerKey(triggerId), condition.id)
      pipe.zrem(subscribedToScopeAndEvent(condition.datasource, condition.scope, condition.scopeId, condition.event), triggerId)
      pipe.zrem(subscribedToUri(EventUri.getUriFromCondition(condition)), triggerId)
    }

    await pipe.exec()
  }

  async deleteById(id: string) {
    const condition = await this.getById(id)
    const pipe = this.redis.pipeline()
    const { triggerId } = condition

    pipe.del(conditionKey(condition.id))
    pipe.del(conditionLogKey(condition.id))
    pipe.srem(conditionSetByTriggerKey(triggerId), condition.id)
    // TODO consider changing for zincrby since zrem
    //   is valid only if there is just 1 condition of certain type of event in a trigger
    pipe.zrem(subscribedToScopeAndEvent(condition.datasource, condition.scope, condition.scopeId, condition.event), triggerId)
    pipe.zrem(subscribedToUri(EventUri.getUriFromCondition(condition)), triggerId)

    await pipe.exec()
  }

  // eslint-disable-next-line require-await
  async getListByTriggerId(triggerId: string): Promise<string[]> {
    // eslint-disable-next-line require-await
    return this.redis.smembers(conditionSetByTriggerKey(triggerId))
  }

  getTriggerListByScopeAndEventName(
    datasource: string,
    scope: string,
    scopeId: string,
    eventName: string,
    start = 0,
    stop = -1): Promise<string[]> {
    return this.redis.zrange(subscribedToScopeAndEvent(datasource, scope, scopeId, eventName), start, stop)
  }

  getTriggerListByUri(uri: string, start = 0, stop = -1): Promise<string[]> {
    return this.redis.zrange(subscribedToUri(uri), start, stop)
  }

  countSubscribedToUri(uri: string): Promise<number> {
    return this.redis.zcard(subscribedToUri(uri))
  }

  /**
   * @description returns a generator of lists of trigger's id subscribed to uri
   *              iterates until all subscribers will be fetched
   */
  async* getSubscribedToUri(uri: string, count = 100): AsyncGenerator<string[], void, void> {
    let cursor = null

    do {
      const [cur, result] = await this.redis.zscan(subscribedToUri(uri), cursor, 'count', count)

      cursor = cur
      yield result.filter((_, index) => index % 2 == 0)
    } while (cursor !== '0')
  }

  async appendToEventLog(conditionId: string, uniqueId: string): Promise<boolean> {
    const logKey = conditionLogKey(conditionId)
    const result = await this.redis.zadd(logKey, "NX", Date.now(), uniqueId)
    return !!result
  }

  async getEventLog(conditionId: string): Promise<string[]> {
    return await this.redis.zrange(conditionLogKey(conditionId), 0, -1)
  }

  async cleanByTriggerId(triggerId: string) {
    const conditions = await this.getByTriggerId(triggerId)

    for (const condition of conditions) {
      const pipe = this.redis.pipeline()

      if (this.expiresInSeconds) {
        pipe.expire(conditionSetByTriggerKey(triggerId), this.expiresInSeconds)
        pipe.expire(conditionKey(triggerId), this.expiresInSeconds)
        pipe.expire(conditionLogKey(condition.id), this.expiresInSeconds)
      } else {
        pipe.del(conditionSetByTriggerKey(triggerId))
        pipe.del(conditionKey(condition.id))
        pipe.del(conditionLogKey(condition.id))
      }

      pipe.zrem(subscribedToScopeAndEvent(condition.datasource, condition.scope, condition.scopeId, condition.event), triggerId)
      pipe.zrem(subscribedToUri(condition.uri), triggerId)

      await pipe.exec()
    }
  }

  async unsubscribeTriggerFromEvents(triggerId: string) {
    const conditions = await this.getByTriggerId(triggerId)

    for (const condition of conditions) {
      const pipe = this.redis.pipeline()

      pipe.zrem(subscribedToScopeAndEvent(condition.datasource, condition.scope, condition.scopeId, condition.event), triggerId)
      pipe.zrem(subscribedToUri(condition.uri), triggerId)

      await pipe.exec()
    }
  }

  private async afterRead(condition: TriggerCondition | Record<string, string>, appendLog?: boolean) {
    condition.chainOrder = parseInt(condition.chainOrder as unknown as string)
    condition.activated = (condition.activated as unknown as string) == '1'

    if (condition.options) {
      condition.options = JSON.parse(condition.options as any)
    }

    if (condition.targets) {
      condition.targets = JSON.parse(condition.targets as any)
    }

    if (appendLog) {
      condition.log = await this.getEventLog(condition.id)
    }
  }
}

