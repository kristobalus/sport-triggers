// import * as assert from "assert"
import { randomUUID } from "crypto"

import { Redis } from "ioredis"

import { SerializedTriggerSubscription, TriggerSubscription } from "../models/entities/trigger-subscription"
import { assertNoError } from "../utils/pipeline-utils"

export function subscriptionByTriggerKey(triggerId: string) {
  return `triggers/${triggerId}/subscriptions`
}

export function subscriptionKey(subscriptionId: string) {
  return `subscriptions/${subscriptionId}`
}

export function entitySubscriptionSetKey(entity: string, entityId: string) {
  return `entities/${entity}/${entityId}/subscriptions`
}

export class TriggerSubscriptionCollection {
  constructor(
    private redis: Redis,
  ) {
  }

  async create(triggerId: string, item: Partial<TriggerSubscription>): Promise<string> {
    const data: SerializedTriggerSubscription = {}

    data.id = randomUUID()
    data.triggerId = triggerId
    data.route = item.route

    if (item.payload) {
      data.payload = JSON.stringify(item.payload)
    }

    if (item.options) {
      data.options = JSON.stringify(item.options)
    }

    const pipe = this.redis.pipeline()
    pipe.hset(subscriptionKey(data.id), data as unknown as Record<string, any>)
    pipe.sadd(subscriptionByTriggerKey(triggerId), data.id)
    pipe.sadd(entitySubscriptionSetKey(item.entity, item.entityId), data.id)
    await pipe.exec()

    return data.id
  }

  async deleteOne(id: string): Promise<boolean> {
    const item = await this.getOne(id)
    const pipe = this.redis.pipeline()

    pipe.del(subscriptionKey(item.id))
    pipe.srem(subscriptionByTriggerKey(item.triggerId), id)
    pipe.srem(entitySubscriptionSetKey(item.entity, item.entityId), id)
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

    if ( item.payload ) {
      item.payload = JSON.parse(item.payload as unknown as string)
    }

    if (item.options) {
      item.options = JSON.parse(item.options as unknown as string)
    }

    return item as unknown as TriggerSubscription
  }

  async getListByTrigger(triggerId: string): Promise<string[]> {
    return this.redis.smembers(subscriptionByTriggerKey(triggerId))
  }

  async getListByEntity(entity: string, entityId: string): Promise<string[]> {
    return this.redis.smembers(entitySubscriptionSetKey(entity, entityId))
  }

}
