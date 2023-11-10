import { ScopeSnapshot } from './scope-snapshot'

export interface EventSnapshot extends ScopeSnapshot {
  name: string
  value: string
}
