import { Team } from './team'
import { Period } from './event'

export interface Game {
  id: string
  status: string
  coverage: string
  reference: string
  scheduled: string
  home: Team
  away: Team
  periods?: Period[]
}
