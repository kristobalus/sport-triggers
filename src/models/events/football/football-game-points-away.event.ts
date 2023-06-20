// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"

export interface FootballGamePointsAwayEvent extends BaseEvent {
  name: "football.game.points.away"
  value: number
}
