
import { CompareOp, ConditionType } from '../../../models/entities/trigger-condition'
import { EventMetadata } from "../../../models/events/event-metadata"

import { FootballEvents } from "./football-events"
import { GameLevel } from "./game-level"
import { PlayerState } from "./player-state"

export const metadata: Record<string, EventMetadata> = {

  [FootballEvents.Player]: {
    sport: 'football',
    input: "select",
    type: ConditionType.String,
    primary: true,
    label: "Player",
    compare: [
      CompareOp.Equal
    ],
    targets: [],
    targetSource: "players"
  },

  [FootballEvents.GameLevel]: {
    sport: 'football',
    input: "select.multi",
    type: ConditionType.String,
    primary: true,
    label: "Game level",
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
    targetSource: "football.gamelevel"
  },

  [FootballEvents.GamePointsHome]: {
    sport: 'football',
    primary: true,
    label: "Total points, home",
    input: "number",
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterOrEqual,
      CompareOp.GreaterThan,
      CompareOp.LessOrEqual,
      CompareOp.LessThan
    ],
  },

  [FootballEvents.GamePointsAway]: {
    sport: 'football',
    label: "Total points, away",
    primary: true,
    input: "number",
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterOrEqual,
      CompareOp.GreaterThan,
      CompareOp.LessOrEqual,
      CompareOp.LessThan
    ],
    type: ConditionType.Number
  },

  [FootballEvents.PlayerState]: {
    sport: 'football',
    input: "select.multi",
    type: ConditionType.String,
    primary: true,
    label: 'Player state',
    compare: [
      CompareOp.Equal
    ],
    targets: [
      PlayerState.Penalty,
      PlayerState.Touchdown,
      PlayerState.BigPlay,
      PlayerState.FirstDown,
    ],
  },

  [FootballEvents.PlayerPassing]: {
    sport: 'football',
    primary: true,
    label: 'Player passing',
    input: "number",
    type: ConditionType.Number,
    targets: [],
    targetSource: "football.game.players"
  },

  [FootballEvents.PlayerRushing]: {
    sport: 'football',
    input: "number",
    primary: true,
    label: "Player rushing",
    type: ConditionType.Number,
    targets: [],
    targetSource: "football.game.players"
  },

  [FootballEvents.PlayerReceiving]: {
    sport: 'football',
    input: "number",
    type: ConditionType.Number,
    primary: true,
    label: "Player receiving",
    targets: [],
    targetSource: "football.game.players"
  },


}
