// import * as assert from "assert"
import { randomUUID } from 'crypto'
import assert from 'assert'

import { Redis } from 'ioredis'

import { TriggerSubscription } from '../models/entities/trigger-subscription'
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

/**
 * set
 */
export function subscriptionReasons(subscriptionId: string) {
  return `subscriptions/${subscriptionId}/reasons`
}

export function validateOnCreate(data: Partial<TriggerSubscription>) {
  assert(data.entity, `entity should be defined`)
  assert(data.entityId, `entityId should be defined`)
}

export class TriggerSubscriptionCollection {
  constructor(
    private redis: Redis,
    private expiresInSeconds?: number
  ) {
  }

  async create(triggerId: string, data: Partial<TriggerSubscription>): Promise<string> {

    validateOnCreate(data)

    const item: Partial<TriggerSubscription> = {
      id: randomUUID(),
      triggerId: triggerId,
      ...data
    }

    const pipe = this.redis.pipeline()
    pipe.hset(subscriptionKey(item.id), this.serialize(item))
    pipe.sadd(subscriptionByTriggerKey(triggerId), item.id)
    pipe.sadd(subscriptionByEntityKey(data.entity, data.entityId), item.id)

    if (this.expiresInSeconds) {
      pipe.expire(subscriptionKey(item.id), this.expiresInSeconds)
      pipe.expire(subscriptionByTriggerKey(triggerId), this.expiresInSeconds)
      pipe.expire(subscriptionByEntityKey(data.entity, data.entityId), this.expiresInSeconds)
    }

    await pipe.exec()

    return item.id
  }

  private serialize(item: Partial<TriggerSubscription>):  Record<string, any> {
    const data = {
      ...item
    }

    if (item.payload) {
      data.payload = JSON.stringify(item.payload) as any
    }

    if (item.options) {
      data.options = JSON.stringify(item.options) as any
    }

    return data
  }

  private deserialize(item: Record<string, any>) : TriggerSubscription {

    if (item.payload) {
      item.payload = JSON.parse(item.payload as unknown as string)
    }

    if (item.options) {
      item.options = JSON.parse(item.options as unknown as string)
    }

    return item as unknown as TriggerSubscription
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

    return this.deserialize(item)
  }

  getListByTrigger(triggerId: string): Promise<string[]> {
    return this.redis.smembers(subscriptionByTriggerKey(triggerId))
  }

  getListByEntity(entity: string, entityId: string): Promise<string[]> {
    return this.redis.smembers(subscriptionByEntityKey(entity, entityId))
  }

  updateOne(id: string, data: Partial<TriggerSubscription>): Promise<number> {
    return this.redis.hset(subscriptionKey(id), data as unknown as Record<string, any>)
  }

  async addReason(subscriptionId: string, reason: string) : Promise<number> {
    return await this.redis.sadd(subscriptionReasons(subscriptionId), reason)
  }
}
