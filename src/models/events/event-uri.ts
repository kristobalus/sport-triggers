import { TriggerCondition } from '../entities/trigger-condition'

import { EventSnapshot } from './event-snapshot'

export function getUriFromEvent(event: Partial<EventSnapshot>) {
  const { datasource, scope, scopeId, name } = event

  return `${datasource}/${scope}/${scopeId}/${name}`
}

export function getUriFromCondition(condition: Partial<TriggerCondition>) {
  const { scope, scopeId, event, datasource } = condition

  return `${datasource}/${scope}/${scopeId}/${event}`
}
