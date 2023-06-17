import { BaseEvent } from "./base.event"

// @ts-ignore
interface GameHomePointsEvent extends BaseEvent {
  name: "game.home_points"
  value: number
}
