// noinspection JSUnusedGlobalSymbols

import { Event } from "../event"

import { FootballEvents } from "./football-events"

export interface FootballGamePointsAwayEvent extends Event {
  name: FootballEvents.GamePointsAway
  value: string
}
