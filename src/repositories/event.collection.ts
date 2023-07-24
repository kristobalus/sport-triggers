
import { Redis } from 'ioredis'
import { AdapterEvent } from "../models/events/adapter-event"


export function getEventDataKey(gameId: string){
  return `games/${gameId}/event-data`
}

export function getEventIndexKey(gameId: string){
  return `games/${gameId}/event-index`
}

export class EventCollection {
  constructor(
    private redis: Redis
  ) {
  }

  async append(event: AdapterEvent){
    const gameId = event.scopeId
    await this.redis.hset(getEventDataKey(gameId), event.id, JSON.stringify(event))
    await this.redis.zadd(getEventIndexKey(gameId), event.timestamp, event.id)
  }

  /**
   * @description list of event id, sorted by timestamp from first to last
   */
  async getEventIndex(gameId: string) : Promise<string[]> {
    return this.redis.zrangebyscore(getEventIndexKey(gameId), "-inf", "+inf")
  }

  async getEvent(gameId: string, eventId: string) : Promise<AdapterEvent> {
    const data = await this.redis.hget(getEventDataKey(gameId), eventId)
    return JSON.parse(data)
  }

}

