// noinspection JSUnusedGlobalSymbols

import { Event } from '../event'

import { BaseballEvents } from './baseball-events'

export interface BaseballGamePointsAwayEvent extends Event {
  name: BaseballEvents.GamePointsAway
  value: string
}
