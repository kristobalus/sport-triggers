// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"

import { FootballEvents } from "./football-events"

export interface FootballPlayerStateEvent extends BaseEvent {
  name: FootballEvents.PlayerState
  playerId: string
}
