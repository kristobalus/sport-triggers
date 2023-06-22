import { ConditionType } from "./entities/trigger-condition"
import { FootballEvents } from "./events/football/football-events"
import { GameLevel } from "./events/football/football-game-level.event"
import { FootballPlayerStates } from "./events/football/football-player-states"

export interface EventMetadata {
  title: string
  sport: string
  description: string
  input: boolean
  targets: string[]
  type: ConditionType
}

export const metadata : Record<string, EventMetadata> = {

  [FootballEvents.GameLevel]: {
    title: "Game Level",
    sport: "football",
    description: "Game state changed",
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
    title: "Game Level, Total Points change",
    sport: "football",
    description: "Home team points changed",
    input: true,
    type: ConditionType.SetAndCompare,
    targets: [],
  },

  [FootballEvents.GamePointsAway]: {
    title: "Game Level, Total Points change",
    sport: "football",
    description: "Away team points changed",
    input: true,
    type: ConditionType.SetAndCompare,
    targets: [],
  },

  [FootballEvents.PlayerState]: {
    title: "Player Level",
    sport: "football",
    description: "Player states",
    input: true,
    type: ConditionType.SetAndCompareAsString,
    targets: [
      FootballPlayerStates.Penalty,
      FootballPlayerStates.Touchdown,
      FootballPlayerStates.BigPlay,
      FootballPlayerStates.FirstDown,
    ],
  },

  [FootballEvents.PlayerPassing]: {
    title: "Player level, X-yard passing",
    sport: "football",
    description: "X yards passing",
    input: true,
    type: ConditionType.SetAndCompare,
    targets: [],
  },

  [FootballEvents.PlayerRushing]: {
    title: "Player level, X-yard rushing",
    sport: "football",
    description: "X yards rushing",
    input: true,
    type: ConditionType.SetAndCompare,
    targets: [],
  },

  [FootballEvents.PlayerReceiving]: {
    title: "Player level, X-yard receiving",
    sport: "football",
    description: "X yards receiving",
    input: true,
    type: ConditionType.SetAndCompare,
    targets: [],
  },

}
