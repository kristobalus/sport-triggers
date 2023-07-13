
export interface Player {
  id: string
  name: string
  team: string
  position: number
}

export interface Team {
  id: string
  name: string
  home: boolean
}

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


