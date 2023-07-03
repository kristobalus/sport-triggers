
import { Event } from '../event'

import { BaseballEvents } from './baseball-events'

export enum GameLevel {
  Start='start',
  QuarterStart='quarter.start',
  HalfStart='half.start',
  QuarterEnd='quarter.end',
  HalfEnd='half.end',
  End='end'
}

export interface BaseballGameLevelEvent extends Event {
  name: BaseballEvents.GameLevel
  value: GameLevel
}

