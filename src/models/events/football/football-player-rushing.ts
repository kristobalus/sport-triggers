// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"

import { FootballEvents } from "./football-events"

export interface FootballPlayerRushing extends BaseEvent {
  name: FootballEvents.PlayerRushing
  value: number
  playerId: string
}
