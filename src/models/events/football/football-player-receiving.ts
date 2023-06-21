// noinspection JSUnusedGlobalSymbols

import { BaseEvent } from "../base.event"
import { FootballEvents } from "./football-events"

export interface FootballPlayerReceiving extends BaseEvent {
  name: FootballEvents.PlayerReceiving
  value: number
  playerId: string
}
