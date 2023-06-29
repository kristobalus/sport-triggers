// noinspection JSUnusedGlobalSymbols

import { Event } from '../event'

import { BasketballEvents } from './basketball-events'

export interface BasketballGamePointsAwayEvent extends Event {
  name: BasketballEvents.GamePointsAway
  value: string
}
