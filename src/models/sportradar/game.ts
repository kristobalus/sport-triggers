import { Team } from "./team"

export interface Game {
  id: string
  status: string
  coverage: string
  reference: string
  scheduled: string
  home: Team,
  away: Team
}
