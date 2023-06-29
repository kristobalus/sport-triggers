// noinspection JSUnusedGlobalSymbols

import { Event } from '../event'

import { BasketballEvents } from './basketball-events'

export interface BasketballGamePointsHomeEvent extends Event {
  name: BasketballEvents.GamePointsHome
  value: string
}
