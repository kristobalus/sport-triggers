// noinspection JSUnusedGlobalSymbols

import { Event } from '../event'

import { FootballEvents } from './football-events'

export interface FootballGamePointsHomeEvent extends Event {
  name: FootballEvents.GamePointsHome
  value: string
}
