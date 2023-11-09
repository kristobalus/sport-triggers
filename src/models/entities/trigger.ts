
export enum Scope {
  Game = 'game'
}

export interface Trigger {
  // uuid generated for each trigger
  id: string
  // human-readable name just for description purposes
  name: string
  // human-readable name just for description purposes
  description: string
  datasource: string
  sport?: string
  scope: Scope
  scopeId: string
  activated: boolean
  entity: string
  entityId: string
  // mark trigger as deleted by user
  deleted?: boolean
  disabled?: boolean
  disabledEntity?: boolean
}

