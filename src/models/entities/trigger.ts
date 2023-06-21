

export enum Scope {
  Game="game"
}

export enum Datasource {
  Sportradar="sportradar"
}

export interface Trigger {
  // uuid generated for each trigger
  id: string
  // human-readable name just for description purposes
  name: string
  tag: string
  // human-readable name just for description purposes
  description: string
  datasource: Datasource
  scope: Scope
  scopeId: string
  activated: boolean
}

