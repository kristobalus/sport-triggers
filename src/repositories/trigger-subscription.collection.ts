// import * as assert from "assert"
import { Redis } from "ioredis"
import { TriggerSubscription } from "../models/entities/trigger-subscription"

export function subscriptionByTriggerKey(triggerId: string){
  return `triggers/${triggerId}/subscriptions`
}

export function subscriptionKey(subscriptionId: string){
  return `subscriptions/${subscriptionId}`
}

export class TriggerSubscriptionCollection {
  constructor(
    private redis: Redis
  ) {}

  async getOne(subscriptionId: string) : Promise<TriggerSubscription> {
    const item = await this.redis.hgetall(subscriptionKey(subscriptionId))
    item.payload = JSON.parse(item.payload as string)
    return item as unknown as TriggerSubscription
  }

  /**
   * return a list of subscription id
   * @param triggerId
   */
  async getListByTrigger(triggerId: string) : Promise<string[]> {
    return this.redis.smembers(subscriptionByTriggerKey(triggerId))
  }

}
