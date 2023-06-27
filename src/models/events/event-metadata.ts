import { CompareOp, ConditionType } from "../entities/trigger-condition"

import { FootballEvents } from "./football/football-events"
import { GameLevel } from "./football/football-game-level.event"
import { FootballPlayerStates } from "./football/football-player-state.event"

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
    sport: "football",
    input: false,
    type: ConditionType.SetAndCompareAsString,
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
    sport: "football",
    input: true,
    type: ConditionType.SetAndCompare
  },

  [FootballEvents.GamePointsAway]: {
    sport: "football",
    input: true,
    type: ConditionType.SetAndCompare
  },

  [FootballEvents.PlayerState]: {
    sport: "football",
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
    sport: "football",
    input: true,
    type: ConditionType.SetAndCompare,
    params: {
      player: true
    }
  },

  [FootballEvents.PlayerRushing]: {
    sport: "football",
    input: true,
    type: ConditionType.SetAndCompare,
    params: {
      player: true
    }
  },

  [FootballEvents.PlayerReceiving]: {
    sport: "football",
    input: true,
    type: ConditionType.SetAndCompare,
    params: {
      player: true
    }
  },

}
