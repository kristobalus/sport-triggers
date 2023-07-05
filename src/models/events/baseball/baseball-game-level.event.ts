
import { AdapterEvent } from '../adapter-event'

import { BaseballEvents } from './baseball-events'

export enum GameLevel {
  Start='start',
  QuarterStart='quarter.start',
  HalfStart='half.start',
  QuarterEnd='quarter.end',
  HalfEnd='half.end',
  End='end'
}

export interface BaseballGameLevelEvent extends AdapterEvent {
  name: BaseballEvents.GameLevel
  value: GameLevel
}

