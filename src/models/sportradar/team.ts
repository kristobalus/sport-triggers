import { Player } from "./player"

export interface Team {
  name: string
  market: string
  reference: string
  id: string
  sr_id: string
  points: number
  bonus: boolean
  remaining_timeouts: number
  players?: Partial<Player>[]
}
