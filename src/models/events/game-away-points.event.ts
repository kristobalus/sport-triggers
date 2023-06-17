import { BaseEvent } from "./base.event"

// @ts-ignore
interface GameAwayPointsEvent extends BaseEvent {
  name: "game.away_points"
  value: number
}
