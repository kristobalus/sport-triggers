import { getIndexName, getIndexPrefix } from '../../repositories/scope-snapshot.collection'

import { BasketballEvents } from './basketball-events'

const sport = 'basketball'
const scope = 'game'

export function getIndexQuery(datasource: string, scopeId: string) {
  const prefix = getIndexPrefix(datasource, sport, scope, scopeId)
  const name = getIndexName(datasource, sport, scope, scopeId)

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
