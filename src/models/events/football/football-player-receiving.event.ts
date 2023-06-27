// noinspection JSUnusedGlobalSymbols

import { Event } from '../event'
import { Player } from '../player'

import { FootballEvents } from './football-events'

export interface FootballPlayerReceivingEvent extends Event, Player {
  name: FootballEvents.PlayerReceiving
}
