
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
  next: boolean
  entity: string
  entityId: string
  // flag to show that trigger is unsubscribed from events and should be perceived as deleted
  deleted?: boolean
  // flag to show that trigger should be ignored in processing
  disabled?: boolean
  // flag to show that parent entity is disabled and trigger should be ignored in processing
  disabledEntity?: boolean
  // flag to show that card is queued but trigger should be ignored while card processing
  // TODO remove, deprecated
  ignored?: boolean
  // minimum number of conditions to be activated in order to consider trigger as activated
  threshold?: number
}
