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

  async getOneById(id: string): Promise<Trigger> {
    const data = await this.redis.hgetall(triggerKey(id)) as unknown as Trigger

    data.activated = (data.activated as unknown as string) == "true"

    return data.id ? data : null
  }

  async findByScope(scope: string, scopeId: string): Promise<string[]> {
    return this.redis.smembers(triggerSetKey(scope, scopeId))
  }

  async deleteOne(id: string): Promise<boolean> {
    const item = await this.getOneById(id)
    const result = await this.redis.del(triggerKey(id))
    await this.redis.srem(triggerSetKey(item.scope, item.scopeId), id)
    return result == 1
  }

  async updateOne(id: string, item: Partial<Trigger>) {
    assert.ok(id)
    await this.redis.hset(triggerKey(id), item as Record<string, any>)
  }
}
