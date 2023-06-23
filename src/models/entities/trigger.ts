
export enum Scope {
  SportradarGames="sportradar.games"
}

export interface Trigger {
  // uuid generated for each trigger
  id: string
  // human-readable name just for description purposes
  name: string
  // human-readable name just for description purposes
  description: string
  scope: Scope
  scopeId: string
  activated: boolean
  entity: string
  entityId: string
}

