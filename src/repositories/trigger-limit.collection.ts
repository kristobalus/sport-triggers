import { Redis } from 'ioredis'
import { isNaN } from 'lodash'

// import { createArrayFromHGetAll, PipelineResult } from '../utils/pipeline-utils'
import { limits as limitDictionary } from '../sports'
import { CommonLimit } from '../sports/common-limits'

function keyLimitHashTable(triggerId: string) {
  return `trigger-limits/${triggerId}/limit`
}

function keySnapshotSet(
  triggerId: string,
  eventName: string,
  eventValue: string | number,
  ignoreValue?: boolean) {
  if ( ignoreValue || eventValue == null ) {
    return `trigger-limits/${triggerId}/event/${eventName}`
  }

  return `trigger-limits/${triggerId}/event/${eventName}/${eventValue}`
}

function keyCounterSet(triggerId: string) {
  return `trigger-limits/${triggerId}/counters`
}

function keyCounter(triggerId: string, name: string, value?: string | number, ignoreValue?: boolean) {
  if ( ignoreValue || value == null ) {
    return `trigger-limits/${triggerId}/counters/${name}`
  }
  
  return `trigger-limits/${triggerId}/counters/${name}/${value}`
}

// export function keyTimeHashTable(triggerId: string) {
//   return `trigger-limits/${triggerId}/time`
// }
//
// export function keyStateHashTable(triggerId: string) {
//   return `trigger-limits/${triggerId}/state`
// }

export class TriggerLimitCollection {
  constructor(
    private redis: Redis
  ) {}

  async getLimit(triggerId: string, event: string): Promise<number> {
    const value = parseInt(await this.redis.hget(keyLimitHashTable(triggerId), event), 10)
    
    return isNaN(value) ? 0 : value
  }

  async getLimits(triggerId: string): Promise<Record<string, number>> {
    const limits = await this.redis.hgetall(keyLimitHashTable(triggerId))

    for (const event of Object.keys(limits)) {
      limits[event] = parseInt(limits[event], 10) as any
    }
    
    return limits as any as Record<string, number>
  }

  async getCounts(triggerId: string): Promise<Record<string, number>> {
    const counterSet = keyCounterSet(triggerId)
    const counters = await this.redis.smembers(counterSet)

    const counts = {}

    for (const counter of counters) {
      const value = await this.redis.get(counter)
      const [,,, ...parts] = counter.split('/')
      const event = parts.join('/')

      counts[event] = parseInt(value, 10) as any
    }

    if ( counts[CommonLimit.Scope] == undefined ) {
      counts[CommonLimit.Scope] = 0 as any
    }

    if ( counts[CommonLimit.Minute] == undefined ) {
      counts[CommonLimit.Minute] = 0 as any
    }

    return counts as any as Record<string, number>
  }

  async getCount(triggerId: string, eventName: string, eventValue?: string | number): Promise<number> {
    const limit = limitDictionary[eventName]
    // const counters = keyCounterSet(triggerId)
    const counter = keyCounter(triggerId, eventName, eventValue,  limit?.finite ?? false)
    const valueStr = await this.redis.get(counter)
    const value = parseInt(valueStr, 10)
    
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
      const snapshots = keySnapshotSet(triggerId, eventName, eventValue, limit.finite)
      const counters = keyCounterSet(triggerId)
      const counter = keyCounter(triggerId, eventName, eventValue, limit.finite)

      await this.redis.sadd(snapshots, snapshotId)

      const count = await this.redis.scard(snapshots)

      await this.redis.set(counter, count)
      await this.redis.sadd(counters, counter)

      if ( limit.interval ) {
        if ( await this.redis.ttl(snapshots) < 1 ) {
          await this.redis.expire(counter, limit.interval)
        }

        if ( await this.redis.ttl(counter) < 1 ) {
          await this.redis.expire(counter, limit.interval)
        }
      }
    }
  }

  // async getByTriggerId(triggerId: string): Promise<Record<string, number>> {
  //
  //   const pipe = this.redis.pipeline()
  //   pipe.hgetall(keyLimitHashTable(triggerId))
  //   pipe.hgetall(keyCountHashTable(triggerId))
  //   pipe.hgetall(keyTimeHashTable(triggerId))
  //
  //   const [ limits, counts, times ] = createArrayFromHGetAll<Record<string, string>>(await pipe.exec() as PipelineResult[])
  //
  //   const result: Record<string, number> = {} as Record<string, number>
  //
  //   for(const [event, limit] of Object.entries(limits)) {
  //     if (!result[event]) {
  //       result[event] = {} as any
  //     }
  //     let value = limit ? parseInt(limit, 10) as any : 0
  //     result[event].limit = isNaN(value) ? 0 : value
  //   }
  //
  //   for(const [event, count] of Object.entries(counts)) {
  //     if (!result[event]) {
  //       result[event] = {} as any
  //     }
  //     let value = count ? parseInt(count, 10) as any : 0
  //     result[event].count = isNaN(value) ? 0 : value
  //   }
  //
  //   for(const [event, time] of Object.entries(times)) {
  //     if (!result[event]) {
  //       result[event] = {} as any
  //     }
  //     let value = time ? parseInt(time, 10) as any : 0
  //     result[event].time = isNaN(value) ? 0 : value
  //   }
  //
  //   return result
  // }

  async deleteByTriggerId(triggerId: string) {
    const pipe = this.redis.pipeline()

    pipe.del(keyLimitHashTable(triggerId))
    pipe.del(keyCounterSet(triggerId))
    await pipe.exec()
  }
}

