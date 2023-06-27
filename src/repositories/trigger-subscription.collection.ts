// import * as assert from "assert"
import { randomUUID } from 'crypto'

import { Redis } from 'ioredis'

import { SerializedTriggerSubscription, TriggerSubscription } from '../models/entities/trigger-subscription'
import { assertNoError } from '../utils/pipeline-utils'

/**
 * set
 */
export function subscriptionByTriggerKey(triggerId: string) {
  return `triggers/${triggerId}/subscriptions`
}

/**
 * hash
 */
export function subscriptionKey(subscriptionId: string) {
  return `subscriptions/${subscriptionId}`
}

/**
 * set
 */
export function subscriptionByEntityKey(entity: string, entityId: string) {
  return `entities/${entity}/${entityId}/subscriptions`
}

export class TriggerSubscriptionCollection {
  constructor(
    private redis: Redis,
    private expiresInSeconds?: number
  ) {
  }

  async create(triggerId: string, item: Partial<TriggerSubscription>): Promise<string> {
    const data = { ...item } as unknown as SerializedTriggerSubscription

    data.id = randomUUID()
    data.triggerId = triggerId

    if (item.payload) {
      data.payload = JSON.stringify(item.payload)
    }

    if (item.options) {
      data.options = JSON.stringify(item.options)
    }

    const pipe = this.redis.pipeline()

    pipe.hset(subscriptionKey(data.id), data as unknown as Record<string, any>)
    pipe.sadd(subscriptionByTriggerKey(triggerId), data.id)
    pipe.sadd(subscriptionByEntityKey(item.entity, item.entityId), data.id)

    if (this.expiresInSeconds) {
      pipe.expire(subscriptionKey(data.id), this.expiresInSeconds)
      pipe.expire(subscriptionByTriggerKey(triggerId), this.expiresInSeconds)
      pipe.expire(subscriptionByEntityKey(item.entity, item.entityId), this.expiresInSeconds)
    }

    await pipe.exec()

    return data.id
  }

  async deleteOne(id: string): Promise<boolean> {
    const item = await this.getOne(id)
    const pipe = this.redis.pipeline()

    pipe.del(subscriptionKey(item.id))
    pipe.srem(subscriptionByTriggerKey(item.triggerId), id)
    pipe.srem(subscriptionByEntityKey(item.entity, item.entityId), id)
    const result = await pipe.exec()

    assertNoError(result)

    return true
  }

  async deleteByTriggerId(triggerId: string) {
    const ids = await this.getListByTrigger(triggerId)

    for (const id of ids) {
      await this.deleteOne(id)
    }
  }

  async getOne(subscriptionId: string): Promise<TriggerSubscription> {
    const item = await this.redis.hgetall(subscriptionKey(subscriptionId)) as unknown as TriggerSubscription

    if (!item.triggerId) {
      return null
    }

    if (item.payload) {
      item.payload = JSON.parse(item.payload as unknown as string)
    }

    if (item.options) {
      item.options = JSON.parse(item.options as unknown as string)
    }

    return item as unknown as TriggerSubscription
  }

  getListByTrigger(triggerId: string): Promise<string[]> {
    return this.redis.smembers(subscriptionByTriggerKey(triggerId))
  }

  getListByEntity(entity: string, entityId: string): Promise<string[]> {
    return this.redis.smembers(subscriptionByEntityKey(entity, entityId))
  }
}
