import { randomUUID } from 'crypto'
import assert from 'assert'

import { Redis } from 'ioredis'
import { inPlaceSort } from 'fast-sort'
import { ArgumentError } from 'common-errors'

import { TriggerCondition, TriggerConditionOption } from '../models/entities/trigger-condition'
import { assertNoError, createArrayFromHGetAll } from '../utils/pipeline-utils'
import { getEventUri } from '../models/events/event-uri'
import { metadata as metadataDictionary } from '../sports'

export function conditionSetByTriggerKey(triggerId: string) {
  return `triggers/${triggerId}/conditions`
}

export function conditionKey(conditionId: string) {
  return `conditions/${conditionId}`
}

/**
 * @description trigger id set subscribe to uri
 */
export function triggerSubscribedToUri(uri: string) {
  return `subscribers/uri/${uri}/triggers`
}

export function conditionLogKey(conditionId: string) {
  return `conditions/${conditionId}/log`
}

export function intersection(array1: any[], array2: any[]): any[] {
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
  if (condition.event) {
    // only version 1 has event, compare, targets fields in the root condition document
    if (!metadataDictionary[condition.event]) {
      throw new ArgumentError(`metadata not defined for event ${condition.event}`)
    }
    const metadata = metadataDictionary[condition.event]

    condition.type = metadata?.type

    if (!condition.options) {
      condition.options = []
    }

    if (condition.event && condition.targets?.length && condition.compare) {
      // request comes from old version of trigger's UI
      // move data into options
      const option: TriggerConditionOption = {
        event: condition.event,
        compare: condition.compare,
        targets: condition.targets
      }

      condition.options.push(option)
    }
  }

  // if (!condition?.targets?.length) {
  //   throw new ArgumentError('Condition targets should be defined')
  // }
  // condition.targets = condition.targets.map(target => target.toString())

  // if (condition.type == ConditionType.Number) {
  //   condition.current = '0'
  // }

  // if (condition.type == ConditionType.String) {
  //   condition.current = ''
  // }

  // checking allowed targets, if any restricted
  // if (metadata.targets?.length > 0) {
  //   const mutual = intersection(condition.targets, metadata.targets)
  //
  //   if (mutual.length == 0) {
  //     throw new ArgumentError(`Condition for event ${condition.event} should `
  //       + `have target one of ${JSON.stringify(metadata.targets)}.`)
  //   }
  // }

  // checking allowed compare operations, if any restricted
  // if (metadata.compare?.length > 0) {
  //   if (!metadata.compare.includes(condition.compare)) {
  //     throw new ArgumentError(`Condition for event ${condition.event} should `
  //       + `have compare one of ${JSON.stringify(metadata.compare)}.`)
  //   }
  // }

  // if (meta.aggregate) {
  //   if ( condition.aggregateTargets?.length ) {
  //     const { datasource, scopeId, aggregateTargets } = condition
  //     condition.aggregate = meta.aggregate(datasource, scopeId, aggregateTargets)
  //   }
  // }

  if (!condition.options || condition.options.length == 0) {
    throw new ArgumentError('Condition options should be defined')
  }

  condition.options.forEach(option => validateOption(option, condition))
}

export function validateOption(
  option: Partial<TriggerConditionOption>,
  // parent condition
  condition: Partial<TriggerCondition>,
) {
  assert(option.event, 'event should be defined')

  if (!metadataDictionary[option.event]) {
    throw new ArgumentError(`Metadata not defined for event ${option.event}`)
  }

  const { datasource, sport, scope, scopeId } = condition

  const optionMetadata = metadataDictionary[option.event]
  // const parentMetadata = metadataDictionary[optionMetadata.parentOption]
  // if (parentMetadata?.childOptions?.length) {
  //   throw new ArgumentError(`Parent event ${optionMetadata.parentOption} has no child ${option.event}`)
  // }

  const [parentOption] = condition.options.filter(o => o.event === optionMetadata.parentOption)

  // TODO check if parentOption targets should be merged with and not replace the original values
  if (!option.targets?.length && parentOption) {
    if (optionMetadata.inferTargetsFromParent) {
      option.targets = [...parentOption.targets]
    }
  }

  if (!option.targets?.length) {
    throw new ArgumentError(`Option targets should be defined ${JSON.stringify(option)}`)
  }

  // checking allowed targets, if any restricted
  if (optionMetadata.targets?.length > 0) {
    const mutualTargets = intersection(option.targets, optionMetadata.targets)

    if (mutualTargets.length == 0) {
      throw new ArgumentError(`Option for event ${option.event} should `
        + `have target one of ${JSON.stringify(optionMetadata.targets)}.`)
    }
  }

  // checking allowed compare operations, if any restricted
  if (optionMetadata.compare?.length > 0) {
    if (!optionMetadata.compare.includes(option.compare)) {
      throw new ArgumentError(`Option for event ${option.event} should `
        + `have compare one of ${JSON.stringify(optionMetadata.compare)}.`)
    }
  }

  option.parent = optionMetadata.parentOption
  option.type = optionMetadata.type

  if (!option.compare) {
    if (optionMetadata.defaultCompare) {
      option.compare = optionMetadata.defaultCompare
    }
  }

  // for (const item of condition.options) {
  //   if ( item.event === option.event ) {
  //     assert.deepEqual(item, option)
  //   }
  // }

  if (optionMetadata.aggregate) {
    if (!parentOption) {
      throw new ArgumentError(`Parent option should be defined for ${option.event} for aggregation`)
    }
    option.aggregate = optionMetadata.aggregate(datasource, sport, scope, scopeId, parentOption.targets)
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
      throw new ArgumentError('Cannot add empty conditions')
    }

    // prefill and validate data
    const insertCandidates: TriggerCondition[] = []

    for (let i = 0; i < conditions.length; i++) {
      const condition = { ...conditions[i] } as TriggerCondition

      if (!condition.id) {
        condition.id = randomUUID()
      }
      condition.datasource = datasource
      condition.scope = scope
      condition.sport = sport
      condition.scopeId = scopeId

      validateCondition(condition)

      condition.uri = this.getOptionUriList(condition)

      if (!condition.triggerId) {
        condition.triggerId = triggerId
      } else if (condition.triggerId !== triggerId) {
        throw new ArgumentError('Owner conflict')
      }

      insertCandidates.push(condition)
    }

    const pipe = this.redis.pipeline()

    for (const condition of insertCandidates) {
      pipe.hmset(conditionKey(condition.id), this.deflate(condition))

      // should add condition into list of trigger conditions
      pipe.sadd(conditionSetByTriggerKey(condition.triggerId), condition.id)

      // should add trigger into list of uri subscribers
      for (const uri of condition.uri) {
        pipe.zadd(triggerSubscribedToUri(uri), Date.now(), triggerId)
      }
    }

    const results = await pipe.exec()

    assertNoError(results)
  }

  getOptionUriList(condition: TriggerCondition) {
    const { datasource, scope, scopeId }  = condition
    const result = []

    for (const option of condition.options) {
      result.push(getEventUri({ datasource, scope, scopeId, eventName: option.event }))
    }

    return result
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
      await this.inflate(condition, options?.showLog)
    }

    inPlaceSort(conditions).asc('chainOrder')

    return conditions
  }

  async getById(id: string, options: { showLog?: boolean } = {}): Promise<TriggerCondition> {
    const condition = await this.redis.hgetall(conditionKey(id))

    await this.inflate(condition as unknown as TriggerCondition, options?.showLog)

    return condition as unknown as TriggerCondition
  }

  async update(id: string, updated: Partial<TriggerCondition>) {
    const data = { ...updated } as any

    if (data.activated !== undefined) {
      data.activated = data.activated == 1 || data.activated == '1' || data.activated == 'true' ? 1 : 0
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

      for (const uri of condition.uri) {
        pipe.zrem(triggerSubscribedToUri(uri), triggerId)
      }
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

    for (const uri of condition.uri) {
      pipe.zrem(triggerSubscribedToUri(uri), triggerId)
    }

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
    const uri = getEventUri({ datasource, scope, scopeId, eventName })

    return this.redis.zrange(triggerSubscribedToUri(uri), start, stop)
  }

  getTriggerListByUri(uri: string, start = 0, stop = -1): Promise<string[]> {
    return this.redis.zrange(triggerSubscribedToUri(uri), start, stop)
  }

  countSubscribedToUri(uri: string): Promise<number> {
    return this.redis.zcard(triggerSubscribedToUri(uri))
  }

  /**
   * @description returns a generator of lists of trigger's id subscribed to uri
   *              iterates until all subscribers will be fetched
   */
  async* getSubscribedToUri(uri: string, count = 100): AsyncGenerator<string[], void, void> {
    let cursor = null

    do {
      const [cur, result] = await this.redis.zscan(triggerSubscribedToUri(uri), cursor, 'count', count)

      cursor = cur
      yield result.filter((_, index) => index % 2 == 0)
    } while (cursor !== '0')
  }

  async appendToEventLog(conditionId: string, uniqueId: string): Promise<boolean> {
    const logKey = conditionLogKey(conditionId)
    const result = await this.redis.zadd(logKey, 'NX', Date.now(), uniqueId)

    return !!result
  }

  // eslint-disable-next-line require-await
  async getEventLog(conditionId: string): Promise<string[]> {
    return this.redis.zrange(conditionLogKey(conditionId), 0, -1)
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

      for (const uri of condition.uri) {
        pipe.zrem(triggerSubscribedToUri(uri), triggerId)
      }

      await pipe.exec()
    }
  }

  async unsubscribeTriggerFromEvents(triggerId: string) {
    const conditions = await this.getByTriggerId(triggerId)

    for (const condition of conditions) {
      const pipe = this.redis.pipeline()

      for (const uri of condition.uri) {
        pipe.zrem(triggerSubscribedToUri(uri), triggerId)
      }

      await pipe.exec()
    }
  }

  private async inflate(condition: TriggerCondition, appendLog?: boolean) {
    condition.activated = (condition.activated as unknown as string) == '1'

    // condition.chainOrder = parseInt(condition.chainOrder as unknown as string)

    if (condition.targets) {
      condition.targets = JSON.parse(condition.targets as any)
    }

    if (condition.options) {
      condition.options = JSON.parse(condition.options as any)
    }

    if (condition.uri) {
      try {
        // version 2: uri is array
        condition.uri = JSON.parse(condition.uri as any)
      } catch (err) {
        // version 1: uri is a string
        condition.uri = [condition.uri as any]
      }
    }

    if (appendLog) {
      condition.log = await this.getEventLog(condition.id)
    }
  }

  private deflate(condition: TriggerCondition) {
    const data: any =  {
      ...condition
    }

    if ( data.options) {
      data.options = JSON.stringify(data.options)
    }

    if ( data.uri ) {
      data.uri = JSON.stringify(data.uri)
    }

    if ( data.targets ) {
      data.targets = JSON.stringify(data.targets)
    }

    return data
  }

  hasUri(condition: TriggerCondition, uri: string) {
    return condition.uri.includes(uri)
  }
}

