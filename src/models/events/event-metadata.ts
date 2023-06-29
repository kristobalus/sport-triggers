import { CompareOp, ConditionType } from '../entities/trigger-condition'

import { FootballEvents } from './football/football-events'
import { BaseballEvents } from './baseball/baseball-events'
import { GameLevel as FootballGameLevel } from './football/football-game-level.event'
import { GameLevel as BasketballGameLevel } from './basketball/basketball-game-level.event'
import { GameLevel as BaseballGameLevel } from './baseball/baseball-game-level.event'
import { FootballPlayerStates } from './football/football-player-state.event'
import { BasketballEvents } from "./basketball/basketball-events"

export interface EventMetadata {
  sport: string
  input: boolean
  targets?: string[]
  compare?: string[]
  type: ConditionType
  params?: {
    player?: boolean
  }
}

export const metadata: Record<string, EventMetadata> = {

  [FootballEvents.GameLevel]: {
    sport: 'football',
    input: false,
    type: ConditionType.SetAndCompareAsString,
    compare: [
      CompareOp.Equal
    ],
    targets: [
      FootballGameLevel.Start,
      FootballGameLevel.End,
      FootballGameLevel.HalfStart,
      FootballGameLevel.HalfEnd,
      FootballGameLevel.QuarterStart,
      FootballGameLevel.QuarterEnd,
      FootballGameLevel.UnderReview,
    ],
  },

  [FootballEvents.GamePointsHome]: {
    sport: 'football',
    input: true,
    type: ConditionType.SetAndCompare
  },

  [FootballEvents.GamePointsAway]: {
    sport: 'football',
    input: true,
    type: ConditionType.SetAndCompare
  },

  [FootballEvents.PlayerState]: {
    sport: 'football',
    input: true,
    type: ConditionType.SetAndCompareAsString,
    compare: [
      CompareOp.Equal
    ],
    targets: [
      FootballPlayerStates.Penalty,
      FootballPlayerStates.Touchdown,
      FootballPlayerStates.BigPlay,
      FootballPlayerStates.FirstDown,
    ],
    params: {
      player: true
    }
  },

  [FootballEvents.PlayerPassing]: {
    sport: 'football',
    input: true,
    type: ConditionType.SetAndCompare,
    params: {
      player: true
    }
  },

  [FootballEvents.PlayerRushing]: {
    sport: 'football',
    input: true,
    type: ConditionType.SetAndCompare,
    params: {
      player: true
    }
  },

  [FootballEvents.PlayerReceiving]: {
    sport: 'football',
    input: true,
    type: ConditionType.SetAndCompare,
    params: {
      player: true
    }
  },

  [BasketballEvents.GameLevel]: {
    sport: 'basketball',
    input: false,
    type: ConditionType.SetAndCompareAsString,
    compare: [
      CompareOp.Equal
    ],
    targets: [
      BasketballGameLevel.Start,
      BasketballGameLevel.End,
      BasketballGameLevel.HalfStart,
      BasketballGameLevel.HalfEnd,
      BasketballGameLevel.QuarterStart,
      BasketballGameLevel.QuarterEnd
    ]
  },

  [BaseballEvents.GameLevel]: {
    sport: 'baseball',
    input: false,
    type: ConditionType.SetAndCompareAsString,
    compare: [
      CompareOp.Equal
    ],
    targets: [
      BaseballGameLevel.Start,
      BaseballGameLevel.End,
      BaseballGameLevel.HalfStart,
      BaseballGameLevel.HalfEnd,
      BaseballGameLevel.QuarterStart,
      BaseballGameLevel.QuarterEnd
    ]
  },

}
