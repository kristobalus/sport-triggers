// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"
import { FootballEvents } from "./football-events"

export interface FootballPlayerState extends BaseEvent {
  name: FootballEvents.PlayerState
  playerId: string
}
