import { TriggerCondition } from '../entities/trigger-condition'

import { Event } from './event'

export function fromEvent(event: Partial<Event>) {
  const { datasource, scope, scopeId, name } = event
  
  return `event://${datasource}/${scope}/${scopeId}/${name}`
}

export function fromCondition(condition: Partial<TriggerCondition>) {
  const { scope, scopeId, event, datasource } = condition
  
  return `event://${datasource}/${scope}/${scopeId}/${event}`
}
