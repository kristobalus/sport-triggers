
import { Event } from '../event'

import { FootballEvents } from './football-events'

export enum GameLevel {
  Start='start',
  QuarterStart='quarter.start',
  HalfStart='half.start',
  QuarterEnd='quarter.end',
  HalfEnd='half.end',
  End='end',
  UnderReview='under_review'
}

export interface FootballGameLevelEvent extends Event {
  name: FootballEvents.GameLevel
  value: GameLevel
}

