// noinspection JSUnusedGlobalSymbols

import { Event } from "../event"

import { FootballEvents } from "./football-events"
import { Player } from "../player"

export enum FootballPlayerStates {
  FirstDown = "first.down",
  Touchdown = "touchdown",
  BigPlay="big.play",
  Penalty="penalty"
}

export interface FootballPlayerStateEvent extends Event, Player {
  name: FootballEvents.PlayerState
  value: FootballPlayerStates
}

/*
  {
    "name": "football.player.state"
    "value": "running"
    "player": "{GUID}"
  }
  URI = name + player
  trigger -> URI1, URI2, URI3

  URI: football/players/${player}/states
  target -> touchdown
  current -> running

  event + filters inside it -> unique id
 */

