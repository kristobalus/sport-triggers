import { Player } from './player'
import { Team } from './team'
import { Sport } from '../events/sport'

export interface Game {
  datasource: string
  scope: string
  id: string
  sport: Sport
  players: Player[]
  teams: Record<string, Team>
  home: string
  away: string
}
