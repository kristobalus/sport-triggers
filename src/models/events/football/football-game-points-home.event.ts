// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"

import { FootballEvents } from "./football-events"

export interface FootballGamePointsHomeEvent extends BaseEvent {
  name: FootballEvents.GamePointsHome
  value: number
}
