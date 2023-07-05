// noinspection JSUnusedGlobalSymbols

import { AdapterEvent } from '../adapter-event'

import { BasketballEvents } from './basketball-events'

export interface BasketballGamePointsHomeEvent extends AdapterEvent {
  name: BasketballEvents.GamePointsHome
  value: string
}
