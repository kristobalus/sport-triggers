import { CompareOp, ConditionType } from '../../entities/trigger-condition'
import { EventMetadata } from "../event-metadata"
import { FootballEvents } from "./football-events"
import { GameLevel } from "./football-game-level"
import { FootballPlayerState } from "./football-player-state"

export const metadata: Record<string, EventMetadata> = {

  [FootballEvents.Player]: {
    sport: 'football',
    input: false,
    type: ConditionType.String,
    compare: [
      CompareOp.Equal
    ]
  },

  [FootballEvents.GameLevel]: {
    sport: 'football',
    input: false,
    type: ConditionType.String,
    compare: [
      CompareOp.Equal
    ],
    targets: [
      GameLevel.Start,
      GameLevel.End,
      GameLevel.HalfStart,
      GameLevel.HalfEnd,
      GameLevel.QuarterStart,
      GameLevel.QuarterEnd,
      GameLevel.UnderReview,
    ],
  },

  [FootballEvents.GamePointsHome]: {
    sport: 'football',
    input: true,
    type: ConditionType.Number
  },

  [FootballEvents.GamePointsAway]: {
    sport: 'football',
    input: true,
    type: ConditionType.Number
  },

  [FootballEvents.PlayerState]: {
    sport: 'football',
    input: true,
    type: ConditionType.String,
    compare: [
      CompareOp.Equal
    ],
    targets: [
      FootballPlayerState.Penalty,
      FootballPlayerState.Touchdown,
      FootballPlayerState.BigPlay,
      FootballPlayerState.FirstDown,
    ]
  },

  [FootballEvents.PlayerPassing]: {
    sport: 'football',
    input: true,
    type: ConditionType.Number
  },

  [FootballEvents.PlayerRushing]: {
    sport: 'football',
    input: true,
    type: ConditionType.Number
  },

  [FootballEvents.PlayerReceiving]: {
    sport: 'football',
    input: true,
    type: ConditionType.Number
  },


}
