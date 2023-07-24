import { Team } from "./team"
import { Player } from "./player"

export type EventType = "lineupchange"

export interface Attribution {
  name: string
  market: string
  reference: string
  id: string
  sr_id: string
}

export interface Period {
  id: string
  number: number
  sequence: number
  type: string
}

export type EventPlayer = Pick<Player, "full_name" | "jersey_number" | "reference" | "id" | "sr_id">
export type EventTeam = Pick<Team, "name" | "market" | "reference" | "id" | "sr_id">

export interface Court {
  home: Team
  away: Team
}

export interface Event {
  id: string
  event_type: string
  number: number
  sequence: number
  clock: string
  clock_decimal: string
  // ISO8601
  updated: string
  // ISO8601
  wall_clock: string
  created: string
  description: string
  home_points: number
  away_points: number
  attribution: Attribution,
  period: Period,
  on_court: Court
}
