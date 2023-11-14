import { Redis } from 'ioredis'

import { ScopeSnapshot } from '../models/events/scope-snapshot'
import * as Basketball from '../sports/basketball/redis-index'

export interface AggregateResult {
  [k: string]: string
}

export function getIndexName(datasource: string, sport: string, scope: string, scopeId: string) {
  return `index_${datasource}_${sport}_${scope}_${scopeId}`
}

export function getIndexPrefix(datasource: string, sport: string, scope: string, scopeId: string) {
  return `json/${datasource}/${sport}/${scope}/${scopeId}/events/`
}

export function getSnapshotKey(datasource: string, sport: string, scope: string, scopeId: string, eventId: string) {
  return `json/${datasource}/${sport}/${scope}/${scopeId}/events/${eventId}`
}

export function getSnapshotKeyByEntity(snapshot: ScopeSnapshot) {
  const { datasource, sport, scope, scopeId, id: eventId } = snapshot
  return getSnapshotKey(datasource, sport, scope, scopeId, eventId)
}

export class ScopeSnapshotCollection {
  private indices: Map<string, boolean> = new Map()

  constructor(
    private redis: Redis
  ) {}

  // eslint-disable-next-line require-await
  async execute(query: string[]) {
    const [cmd, ...args] = query

    return this.redis.send_command(cmd, ...args)
  }

  // eslint-disable-next-line require-await
  async dropIndex(name: string) {
    return this.redis.send_command('ft.dropindex', name)
  }

  clearIndices() {
    this.indices.clear()
  }

  async createIndex(datasource: string, sport: string, scope: string, scopeId: string): Promise<boolean> {
    if ( sport == 'basketball' ) {
      const indexName = getIndexName(datasource, sport, scope, scopeId)

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
    }
    else if ( sport == 'baseball' ) {
      // doing nothing
      return false
    }
    else {
      throw new Error(`Unknown sport: ${sport}`)
    }
  }

  async append(data: ScopeSnapshot): Promise<boolean> {
    const { datasource, sport, scope, scopeId, id } = data

    await this.createIndex(datasource, sport, scope, scopeId)

    data.events = Object.keys(data.options)

    const key = getSnapshotKey(datasource, sport, scope, scopeId, id)
    const json = JSON.stringify(data)
    const result = await this.redis.send_command('json.set', key, '$', json)

    return result == 'OK'
  }

  async getItem(datasource: string, sport: string, scope: string, scopeId: string, eventId: string): Promise<ScopeSnapshot> {
    const key = getSnapshotKey(datasource, sport, scope, scopeId, eventId)
    const result = await this.redis.send_command('json.get', key, '$')

    return JSON.parse(result)
  }
}
