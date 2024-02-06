import { Redis } from 'ioredis'

import { ScopeSnapshot } from '../models/events/scope-snapshot'
import { redisIndexQueryBuilders }  from '../sports'
import { createObjectFromArray } from '../utils/pipeline-utils'

export interface AggregateResult {
  [k: string]: string
}

export function getIndexName(datasource: string, sport: string, scope: string, scopeId: string) {
  return `index_${datasource}_${sport}_${scope}_${scopeId}`
}

export function getIndexPrefix(datasource: string, sport: string, scope: string, scopeId: string) {
  return `json/${datasource}/${sport}/${scope}/${scopeId}/snapshots/`
}

export function getSnapshotKey(options: {
  datasource: string,
  sport: string,
  scope: string,
  scopeId: string,
  snapshotId: string }) {
  const { datasource, sport, scope, scopeId, snapshotId } = options
  return `json/${datasource}/${sport}/${scope}/${scopeId}/snapshots/${snapshotId}`
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
    const indexName = getIndexName(datasource, sport, scope, scopeId)

    const queryBuilder = redisIndexQueryBuilders[sport]
    if ( queryBuilder && !this.indices.has(indexName) ) {
      const query = queryBuilder(datasource, scopeId)

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

  async append(data: ScopeSnapshot): Promise<boolean> {
    const { datasource, sport, scope, scopeId, id } = data

    await this.createIndex(datasource, sport, scope, scopeId)

    data.events = Object.keys(data.options)

    const key = getSnapshotKey({ datasource, sport, scope, scopeId, snapshotId: id })
    const json = JSON.stringify(data)
    const result = await this.redis.send_command('json.set', key, '$', json)

    return result == 'OK'
  }

  async hasSnapshot(data: ScopeSnapshot) : Promise<boolean> {
    const { datasource, sport, scope, scopeId, id } = data
    const key = getSnapshotKey({ datasource, sport, scope, scopeId, snapshotId: id })
    const count = await this.redis.exists(key)
    return count > 0
  }

  async getItem(
    datasource: string,
    sport: string,
    scope: string,
    scopeId: string,
    snapshotId: string): Promise<ScopeSnapshot> {

    const key = getSnapshotKey({ datasource, sport, scope, scopeId, snapshotId })
    const result = await this.redis.send_command('json.get', key, '$')

    return JSON.parse(result)
  }

  async getList() {
    return await this.execute(["ft._list"])
  }

  async count(datasource: string, sport: string, scope: string, scopeId: string): Promise<number> {
    const indexName = getIndexName(datasource, sport, scope, scopeId)
    const data = createObjectFromArray(await this.execute(["ft.info", indexName]))
    return data["num_docs"]
  }
}

