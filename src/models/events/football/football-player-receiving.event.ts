// noinspection JSUnusedGlobalSymbols

import { Event } from "../event"

import { FootballEvents } from "./football-events"
import { Player } from "../player"

export interface FootballPlayerReceivingEvent extends Event, Player {
  name: FootballEvents.PlayerReceiving
}
