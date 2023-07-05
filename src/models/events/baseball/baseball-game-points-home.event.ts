
import { AdapterEvent } from '../adapter-event'

import { BaseballEvents } from './baseball-events'
import { Game } from "../game"

export interface BaseballGamePointsHomeEvent extends AdapterEvent, Game {
  name: BaseballEvents.GamePointsHome
  value: string
}
