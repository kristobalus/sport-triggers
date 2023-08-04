import { Redis } from 'ioredis'

import { AdapterEvent } from '../models/events/adapter-event'
import * as Basketball from '../sports/basketball/redis-index'

export interface AggregateResult {
  [k: string]: string
}

export function parse(result): AggregateResult {
  const [, data] = result

  const reduced = {}

  for (let i = 0; i < data.length; i++) {
    if ( i % 2 == 0 ) {
      reduced[data[i]] = data[i + 1]
    }
  }

  return reduced
}

export class EventCollection {
  private indices: Map<string, boolean> = new Map()

  constructor(
    private redis: Redis
  ) {
  }

  // eslint-disable-next-line require-await
  async execute(query: string[]) {
    const [cmd, ...args] = query

    return this.redis.send_command(cmd, ...args)
  }

  // eslint-disable-next-line require-await
  async dropIndex(name: string) {
    return this.redis.send_command('ft.dropindex', name)
  }

  async createIndex(datasource: string, sport: string, scopeId: string): Promise<boolean> {
    if ( sport == 'basketball' ) {
      const indexName = Basketball.getIndexName(datasource, scopeId)

      if ( !this.indices.has(indexName) ) {
        const query = Basketball.getIndexQuery(datasource, scopeId)

        try {
          await this.execute(query)
          this.indices.set(indexName, true)
        } catch (err) {
          if ( err.message == 'Index already exists' ) {
            this.indices.set(indexName, true)
          } else {
            throw err
          }
        }

        return true
      } else {
        return false
      }
    } else {
      throw new Error(`Unknown sport: ${sport}`)
    }
  }

  async append(data: AdapterEvent): Promise<boolean> {
    const { datasource, sport, scopeId, id } = data

    await this.createIndex(datasource, sport, scopeId)

    data.events = Object.keys(data.options)

    if ( sport == 'basketball' ) {
      const key = Basketball.getEventKey(datasource, scopeId, id)
      const json = JSON.stringify(data)
      const result = await this.redis.send_command('json.set', key, '$', json)

      return result == 'OK'
    }

    return false
  }

  async getItem(datasource: string, sport: string, scopeId: string, eventId: string): Promise<AdapterEvent> {
    if ( sport == 'basketball' ) {
      const key = Basketball.getEventKey(datasource, scopeId, eventId)
      const result = await this.redis.send_command('json.get', key, '$')

      return JSON.parse(result)
    }

    return null
  }
}

