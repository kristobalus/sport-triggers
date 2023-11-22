import { Sport } from './sport'
import { getEventUri } from './event-uri'

export interface ScopeSnapshot {
  // datasource snapshot's id
  id: string
  // datasource
  datasource: string
  // scope of event
  scope: string
  // unique scope identifier
  scopeId: string
  // event timestamp
  timestamp: number
  // type of sport
  sport: string | Sport
  // event name -> event value
  options: Record<string, string | number>
  events?: string[]
}

export function getEventUriListBySnapshot(snapshot: ScopeSnapshot) {
  const { datasource, scope, scopeId } = snapshot
  return Object.entries(snapshot.options).map(entry => {
    const [eventName] = entry
    return getEventUri({ datasource, scope, scopeId, eventName })
  })
}
