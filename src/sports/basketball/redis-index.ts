import { BasketballEvents } from './basketball-events'

const sport = 'basketball'
const scope = 'game'

export function getIndexName(datasource: string, scopeId: string) {
  return `index_${datasource}_${sport}_${scopeId}`
}

export function getIndexPrefix(datasource: string, scopeId: string) {
  return `json/${datasource}/${sport}/${scope}/${scopeId}/events/`
}

export function getEventKey(datasource: string, scopeId: string, eventId: string) {
  return `json/${datasource}/${sport}/${scope}/${scopeId}/events/${eventId}`
}

export function getIndexQuery(datasource: string, scopeId: string) {
  const prefix = getIndexPrefix(datasource, scopeId)
  const name = getIndexName(datasource, scopeId)
  
  return [
    'ft.create', name, 'on', 'json', 'prefix', '1', prefix,
    'schema', '$.id', 'as', 'id', 'tag',
    '$.timestamp', 'as', 'timestamp', 'numeric', 'sortable',
    `$.options["${ BasketballEvents.TeamScores3FG }"]`, 'as', 'team_scores_3fg', 'tag',
    `$.options["${ BasketballEvents.Team }"]`, 'as', 'team', 'tag',
    `$.options["${ BasketballEvents.PlayerScores3FG }"]`, 'as', 'player_scores_3fg', 'tag',
    `$.options["${ BasketballEvents.Player }"]`, 'as', 'player', 'tag',
    '$.events', 'as', 'events', 'tag'
  ]
}
