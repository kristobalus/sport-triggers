
import { AdapterEvent } from '../adapter-event'

import { BasketballEvents } from './basketball-events'

export enum GameLevel {
  Start='start',
  QuarterStart='quarter.start',
  HalfStart='half.start',
  QuarterEnd='quarter.end',
  HalfEnd='half.end',
  End='end'
}

export interface BasketballGameLevelEvent extends AdapterEvent {
  name: BasketballEvents.GameLevel
  value: GameLevel
}

