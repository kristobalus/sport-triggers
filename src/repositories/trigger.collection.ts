import { randomUUID } from "crypto"
import * as assert from "assert"

import { Redis } from "ioredis"

import { Trigger } from "../models/entities/trigger"
import { assertNoError } from "../utils/pipeline-utils"

export function triggerKey(triggerId: string) {
  return `triggers/${triggerId}`
}

export function triggerSetByScopeKey(scope: string, scopeId: string) {
  return `scopes/${scope}/${scopeId}/triggers`
}

export function triggerSetByEntityKey(entity: string, entityId: string) {
  return `entities/${entity}/${entityId}/triggers`
}

export class TriggerCollection {
  constructor(
    private redis: Redis,
    private expiresInSeconds?: number
  ) {}

  async add(item: Partial<Trigger>): Promise<string> {
    if (!item.id) {
      item.id = randomUUID()
    }

    const count = await this.redis.hset(triggerKey(item.id), item as Record<string, any>)

    if ( count > 0 ) {
      try {
        const pipe = this.redis.pipeline()

        pipe.sadd(triggerSetByScopeKey(item.scope, item.scopeId), item.id)
        if ( item.entity && item.entityId ) {
          pipe.sadd(triggerSetByEntityKey(item.entity, item.entityId), item.id)
        }

        const result = await pipe.exec()

        assertNoError(result)
      } catch (err) {
        await this.redis.del(triggerKey(item.id))

        return null
      }
    }

    return count > 0 ? item.id : null
  }

  async getOne(id: string): Promise<Trigger> {
    const data = await this.redis.hgetall(triggerKey(id)) as unknown as Trigger

    data.activated = (data.activated as unknown as string) == "true"

    return data.id ? data : null
  }

  async deleteOne(id: string): Promise<boolean> {
    const item = await this.getOne(id)
    const result = await this.redis.del(triggerKey(id))

    const pipe = this.redis.pipeline()

    pipe.srem(triggerSetByScopeKey(item.scope, item.scopeId), id)
    pipe.srem(triggerSetByEntityKey(item.entity, item.entityId), id)
    await pipe.exec()

    return result == 1
  }

  async updateOne(id: string, item: Partial<Trigger>) {
    assert.ok(id)
    await this.redis.hset(triggerKey(id), item as Record<string, any>)
  }

  async getListByEntity(entity: string, entityId: string): Promise<string[]> {
    return this.redis.smembers(triggerSetByEntityKey(entity, entityId))
  }

  async getListByScope(scope: string, scopeId: string): Promise<string[]> {
    return this.redis.smembers(triggerSetByScopeKey(scope, scopeId))
  }

  async clean(id: string) {
    const item = await this.getOne(id)
    const pipe = this.redis.pipeline()

    if ( this.expiresInSeconds ) {
      pipe.expire(triggerKey(id), this.expiresInSeconds)
    } else {
      pipe.del(triggerKey(id))
    }

    pipe.srem(triggerSetByScopeKey(item.scope, item.scopeId), id)
    pipe.srem(triggerSetByEntityKey(item.entity, item.entityId), id)

    await pipe.exec()
  }
}
