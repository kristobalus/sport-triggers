// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"

import { FootballEvents } from "./football-events"

export interface FootballGamePointsAwayEvent extends BaseEvent {
  name: FootballEvents.GamePointsAway
  value: number
}
