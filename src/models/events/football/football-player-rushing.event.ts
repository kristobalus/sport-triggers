// noinspection JSUnusedGlobalSymbols

import { Event } from "../event"
import { Player } from "../player"

import { FootballEvents } from "./football-events"

export interface FootballPlayerRushingEvent extends Event, Player {
  name: FootballEvents.PlayerRushing
}
