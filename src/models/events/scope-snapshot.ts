import { Sport } from './sport'

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
