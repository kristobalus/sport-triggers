import { Redis } from 'ioredis'
import { isNaN } from 'lodash'

import { limits as limitDictionary } from '../sports'
import { redis as redisConfig } from '../configs/redis'

export function keyLimitHashTable(entity: string, entityId: string) {
  return `entity-limits/${entity}/${entityId}/limit`
}

export function keyLimitEnabled(entity: string, entityId: string) {
  return `entity-limits/${entity}/${entityId}/enabled`
}

export function keyCountSnapshotSet(
  entity: string,
  entityId: string,
  eventName: string,
  eventValue: string | number,
  ignoreValue?: boolean
) {
  if (ignoreValue || eventValue == null) {
    return `entity-limits/${entity}/${entityId}/event/${eventName}`
  }
  
  return `entity-limits/${entity}/${entityId}/event/${eventName}/${eventValue}`
}

export function keyCountHashTable(entity: string, entityId: string) {
  return `entity-limits/${entity}/${entityId}/count`
}

export function keyCountHashField(eventName: string, eventValue: string | number, ignoreValue?: boolean) {
  if (ignoreValue || eventValue == null) {
    return `${eventName}`
  }
  
  return `${eventName}/${eventValue}`
}

export function countTimeEvent(name: string) {
  return `${name}`
}

export class EntityLimitCollection {
  constructor(
    private redis: Redis
  ) {}

  // async getByEntityId(entity: string, entityId: string): Promise<Record<string, number>> {
  //   const limits = await this.redis.hgetall(limitKey(entity, entityId))
  //
  //   for(const [key, value] of Object.entries(limits)) {
  //     limits[key] = parseInt(value, 10) as any
  //   }
  //
  //   return limits as any as Record<string, number>
  // }

  async setLimits(entity: string, entityId: string, limits: Record<string, number | string>) {
    await this.redis.hmset(keyLimitHashTable(entity, entityId), limits)
  }

  async getLimits(entity: string, entityId: string): Promise<Record<string, number>> {
    const limits = await this.redis.hgetall(keyLimitHashTable(entity, entityId))

    for (const event of Object.keys(limits)) {
      limits[event] = parseInt(limits[event], 10) as any
    }
    
    return limits as any as Record<string, number>
  }

  async enableLimits(entity: string, entityId: string) {
    await this.redis.set(keyLimitEnabled(entity, entityId), 'true')
  }

  async disableLimits(entity: string, entityId: string) {
    await this.redis.set(keyLimitEnabled(entity, entityId), 'false')
  }

  async isEnabled(entity: string, entityId: string): Promise<boolean> {
    const result = await this.redis.get(keyLimitEnabled(entity, entityId))
    
    return result === 'true'
  }

  async getCounts(entity: string, entityId: string): Promise<Record<string, number>> {
    const hashTable = keyCountHashTable(entity, entityId)
    const counts = await this.redis.hgetall(hashTable)

    for (const event of Object.keys(counts)) {
      counts[event] = parseInt(counts[event], 10) as any
    }

    return counts as any as Record<string, number>
  }

  async getCount(entity: string, entityId: string, eventName: string, eventValue: string | number): Promise<number> {
    const limit = limitDictionary[eventName]
    const hashTable = keyCountHashTable(entity, entityId)
    const hashField = keyCountHashField(eventName, eventValue, limit?.finite ?? false)
    const count = await this.redis.hget(hashTable, hashField)
    const value = parseInt(count, 10)
    
    return isNaN(value) ? 0 : value
  }

  async incrCount(
    entity: string,
    entityId: string,
    snapshotId: string,
    eventName: string,
    eventValue?: string | number) {
    const limit = limitDictionary[eventName]

    if (limit) {
      const uniqueSet = keyCountSnapshotSet(entity, entityId, eventName, eventValue, limit.finite)
      const hashTable = keyCountHashTable(entity, entityId)
      const hashField = keyCountHashField(eventName, eventValue, limit.finite)

      await this.redis.sadd(uniqueSet, snapshotId)

      const count = await this.redis.scard(uniqueSet)

      await this.redis.hset(hashTable, hashField, count)

      if ( limit.interval ) {
        await this.redis.send_command('expire', redisConfig.options.keyPrefix ?? '' + uniqueSet, limit.interval, 'NX')
        await this.redis.send_command('expire', redisConfig.options.keyPrefix ?? '' + hashTable, limit.interval, 'NX')
      }
    }
  }
}

