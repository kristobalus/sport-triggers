import { Player } from "./player"
import { Team } from "./team"

export interface Game {
  datasource: string
  scope: string
  id: string
  sport: string
  players: Player[]
  teams: Record<string, Team>,
  home: string
  away: string
}
