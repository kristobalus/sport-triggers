// noinspection JSUnusedGlobalSymbols

import { AdapterEvent } from '../adapter-event'

import { BasketballEvents } from './basketball-events'

export interface BasketballGamePointsAwayEvent extends AdapterEvent {
  name: BasketballEvents.GamePointsAway
  value: string
}
