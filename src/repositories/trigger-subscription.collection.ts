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

    if (data.payload) {
      data.payload = JSON.stringify(item.payload)
    }

    if (data.options) {
      data.options = JSON.stringify(item.options)
    }

    await this.redis.hset(subscriptionKey(data.id), data as unknown as Record<string, any>)
    await this.redis.sadd(subscriptionByTriggerKey(triggerId), data.id)

    return data.id
  }

  async deleteOne(id: string): Promise<boolean> {
    const item = await this.getOne(id)
    const pipe = this.redis.pipeline()

    pipe.del(subscriptionKey(item.id))
    pipe.del(subscriptionByTriggerKey(item.triggerId))
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
}
