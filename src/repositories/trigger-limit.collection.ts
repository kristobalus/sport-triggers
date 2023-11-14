import { Redis } from 'ioredis'
import { TriggerLimit } from "../models/entities/trigger-limit"
import { isNaN } from "lodash"
import { createArrayFromHGetAll, PipelineResult } from '../utils/pipeline-utils'
import { limits as limitDictionary } from "../sports"
import { CommonLimit } from '../sports/common-limits'
// import { redis as redisConfig } from '../configs/redis'

export function keyLimitHashTable(triggerId: string) {
  return `trigger-limits/${triggerId}/limit`
}

export function keyCountSnapshotSet(
  triggerId: string,
  eventName: string,
  eventValue: string | number,
  ignoreValue?: boolean) {

  if ( ignoreValue || eventValue == null ) {
    return `trigger-limits/${triggerId}/event/${eventName}`
  }

  return `trigger-limits/${triggerId}/event/${eventName}/${eventValue}`
}

export function keyCountHashTable(triggerId: string) {
  return `trigger-limits/${triggerId}/count`
}

export function keyCountHashField(name: string, value: string | number, ignoreValue?: boolean) {
  if ( ignoreValue || value == null ) {
    return `${name}`
  }
  return `${name}/${value}`
}

export function keyTimeHashTable(triggerId: string) {
  return `trigger-limits/${triggerId}/time`
}

export function keyStateHashTable(triggerId: string) {
  return `trigger-limits/${triggerId}/state`
}

export class TriggerLimitCollection {

  constructor(
    private redis: Redis
  ) {}

  async getLimit(triggerId: string, event: string) : Promise<number> {
    let value = parseInt(await this.redis.hget(keyLimitHashTable(triggerId), event), 10)
    return isNaN(value) ? 0 : value
  }

  async getLimits(triggerId: string) : Promise<Record<string, number>> {
    const limits = await this.redis.hgetall(keyLimitHashTable(triggerId))
    for(const event of Object.keys(limits)) {
      limits[event] = parseInt(limits[event], 10) as any
    }
    return limits as any as Record<string, number>
  }

  async getCounts(triggerId: string) : Promise<Record<string, number>> {
    const hashTable = keyCountHashTable(triggerId)
    const counts = await this.redis.hgetall(hashTable)

    for(const event of Object.keys(counts)) {
      counts[event] = parseInt(counts[event], 10) as any
    }

    if ( counts[CommonLimit.Scope] == undefined ) {
      counts[CommonLimit.Scope] = 0 as any
    }

    if ( counts[CommonLimit.Minute] == undefined ) {
      counts[CommonLimit.Minute] = 0 as any
    }

    return counts as any as Record<string, number>
  }

  async getCount(triggerId: string, eventName: string, eventValue: string | number) : Promise<number> {
    const limit = limitDictionary[eventName]
    const hashTable = keyCountHashTable(triggerId)
    const hashField = keyCountHashField(eventName, eventValue,  limit?.finite ?? false)
    const count = await this.redis.hget(hashTable, hashField)
    let value = parseInt(count, 10)
    return isNaN(value) ? 0 : value
  }

  async setLimit(triggerId: string, eventName: string, value: number) {
    await this.redis.hset(keyLimitHashTable(triggerId), eventName, value)
  }

  async setLimits(triggerId: string, limits: Record<string, number | string>) {
    await this.redis.hmset(keyLimitHashTable(triggerId), limits)
  }

  // async incrCount(triggerId: string, snapshotId: string, eventName: string, eventValue: string | number) {
  //   const uniqueSet = countSetKey(triggerId, eventName, eventValue)
  //   await this.redis.sadd(uniqueSet, snapshotId)
  //   const count = await this.redis.scard(uniqueSet)
  //   await this.redis.hset(countHashKey(triggerId), countEvent(eventName, eventValue), count)
  // }

  async incrCount(
    triggerId: string,
    snapshotId: string,
    eventName: string,
    eventValue?: string | number) {

    const limit = limitDictionary[eventName]
    if (limit) {
      const countSet = keyCountSnapshotSet(triggerId, eventName, eventValue, limit.finite)
      const countTable = keyCountHashTable(triggerId)
      const countField = keyCountHashField(eventName, eventValue, limit.finite)

      await this.redis.sadd(countSet, snapshotId)

      const count = await this.redis.scard(countSet)

      await this.redis.hset(countTable, countField, count)

      if ( limit.interval ) {
        // await this.redis.send_command("expire", redisConfig.options.keyPrefix ?? "" + countSet, limit.interval, "NX")
        // await this.redis.send_command("expire", redisConfig.options.keyPrefix ?? "" + countTable, limit.interval, "NX")
        if ( await this.redis.ttl(countSet) < 1 ) {
          await this.redis.expire(countSet, limit.interval)
        }
        if ( await this.redis.ttl(countTable) < 1 ) {
          await this.redis.expire(countTable, limit.interval)
        }
      }
    }
  }

  async getByTriggerId(triggerId: string): Promise<Record<string, TriggerLimit>> {

    const pipe = this.redis.pipeline()
    pipe.hgetall(keyLimitHashTable(triggerId))
    pipe.hgetall(keyCountHashTable(triggerId))
    pipe.hgetall(keyTimeHashTable(triggerId))

    const [ limits, counts, times ] = createArrayFromHGetAll<Record<string, string>>(await pipe.exec() as PipelineResult[])

    const result: Record<string, TriggerLimit> = {} as Record<string, TriggerLimit>

    for(const [event, limit] of Object.entries(limits)) {
      if (!result[event]) {
        result[event] = {} as any
      }
      let value = limit ? parseInt(limit, 10) as any : 0
      result[event].limit = isNaN(value) ? 0 : value
    }

    for(const [event, count] of Object.entries(counts)) {
      if (!result[event]) {
        result[event] = {} as any
      }
      let value = count ? parseInt(count, 10) as any : 0
      result[event].count = isNaN(value) ? 0 : value
    }

    for(const [event, time] of Object.entries(times)) {
      if (!result[event]) {
        result[event] = {} as any
      }
      let value = time ? parseInt(time, 10) as any : 0
      result[event].time = isNaN(value) ? 0 : value
    }

    return result
  }


}

