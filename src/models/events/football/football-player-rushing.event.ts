// noinspection JSUnusedGlobalSymbols

import { Event } from "../event"

import { FootballEvents } from "./football-events"
import { Player } from "../player"

export interface FootballPlayerRushingEvent extends Event, Player {
  name: FootballEvents.PlayerRushing
}
