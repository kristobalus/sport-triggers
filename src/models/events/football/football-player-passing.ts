// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"
import { FootballEvents } from "./football-events"

export interface FootballPlayerPassing extends BaseEvent {
  name: FootballEvents.PlayerPassing
  value: number
  playerId: string
}
