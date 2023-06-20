// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"


export interface FootballGamePointsHomeEvent extends BaseEvent {
  name: "football.game.points.home"
  value: number
}
