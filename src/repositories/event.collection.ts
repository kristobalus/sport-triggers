// import * as assert from "assert"
import { Redis } from "ioredis"

export function triggersByScopeAndEvent(scope: string, scopeId: string, eventName: string) {
  return `events/${scope}/${scopeId}/${eventName}/triggers`
}

export class EventCollection {
  constructor(
    private redis: Redis,
  ) {}

  // async getTriggersByEvent(eventName: string) : Promise<string[]> {
  //   return this.redis.smembers(eventSubscriberSetKey(eventName))
  // }

  async appendTrigger(scope: string, scopeId: string, eventName: string, triggerId: string) {
    await this.redis.sadd(triggersByScopeAndEvent(scope, scopeId, eventName), triggerId)
  }

}
