import { randomUUID } from "crypto"
import * as assert from "assert"

import { Redis } from "ioredis"

import { Trigger } from "../models/entities/trigger"

export function triggerKey(triggerId: string) {
  return `triggers/${triggerId}`
}

export function triggerSetKey(scope: string, scopeId: string) {
  return `scopes/${scope}/${scopeId}/triggers`
}

export class TriggerCollection {
  constructor(
    private redis: Redis
  ) {}

  async add(item: Partial<Trigger>): Promise<string> {

    if (!item.id) {
      item.id = randomUUID()
    }

    const count = await this.redis.hset(triggerKey(item.id), item as Record<string, any>)
    await this.redis.sadd(triggerSetKey(item.scope, item.scopeId), item.id)
    return count > 0 ? item.id : null
  }

  /**
   * fetches trigger by id
   * @param id
   */
  async getOneById(id: string): Promise<Trigger> {
    const data = await this.redis.hgetall(triggerKey(id)) as unknown as Trigger

    return data.id ? data : null
  }

  async findByScope(scope: string, scopeId: string) : Promise<string[]> {
    return await this.redis.smembers(triggerSetKey(scope, scopeId))
  }

  /**
   * deletes trigger
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.redis.del(triggerKey(id))

    return result == 1
  }

  async update(id: string, item: Partial<Trigger>) {
    assert.ok(id)
    await this.redis.hset(triggerKey(id), item as Record<string, any>)
  }
}
