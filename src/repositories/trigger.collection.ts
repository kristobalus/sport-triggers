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
    const { conditions, ...data } = item

    if (!data.id) {
      data.id = randomUUID()
    }
    const count = await this.redis.hset(triggerKey(data.id), data)
    await this.redis.sadd(triggerSetKey(item.scope, item.scopeId), data.id)
    return count > 0 ? data.id : null
  }

  /**
   * fetches trigger by id
   * @param id
   */
  async getOneById(id: string): Promise<Trigger> {
    const data = await this.redis.hgetall(triggerKey(id)) as unknown as Trigger

    return data.id ? data : null
  }

  async getByScope(scope: string, scopeId: string) {
    const triggers = await this.redis.smembers(triggerSetKey(scope, scopeId))
    const result = []
    for(const id of triggers){
      const item = this.getOneById(id)
      result.push(item)
    }
    return result
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
    const { conditions, ...data } = item

    await this.redis.hset(triggerKey(id), data)
  }
}
