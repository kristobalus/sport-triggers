// noinspection JSUnusedGlobalSymbols

import { AdapterEvent } from '../adapter-event'

import { BaseballEvents } from './baseball-events'
import { Game } from "../game"

export interface BaseballGamePointsAwayEvent extends AdapterEvent, Game  {
  name: BaseballEvents.GamePointsAway
  value: string
}
