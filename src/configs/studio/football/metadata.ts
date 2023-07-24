import { CompareOp, ConditionType } from '../../../models/entities/trigger-condition'
import { EventMetadata } from "../../../models/events/event-metadata"

import { FootballEvents } from "./football-events"
import { GameLevel } from "./game-level"
import { PlayerState } from "./player-state"
import { StudioInputs } from "../../../models/studio/studio.inputs"

export const metadata: Record<string, EventMetadata> = {

  [FootballEvents.Player]: {
    sport: 'football',
    input: StudioInputs.String,
    type: ConditionType.String,
    primary: true,
    label: "Player",
    compare: [
      CompareOp.Equal
    ],
    targets: [],
    targetSource: "game.players"
  },

  [FootballEvents.GameLevel]: {
    sport: 'football',
    input: StudioInputs.SelectMulti,
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
    targetSource: "football.game.level"
  },

  [FootballEvents.GamePointsHome]: {
    sport: 'football',
    primary: true,
    label: "Total points, home",
    input: StudioInputs.Number,
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
    input: StudioInputs.Number,
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
    input: StudioInputs.SelectMulti,
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
    input: StudioInputs.Number,
    type: ConditionType.Number,
    targets: [],
    targetSource: "game.players"
  },

  [FootballEvents.PlayerRushing]: {
    sport: 'football',
    input: StudioInputs.Number,
    primary: true,
    label: "Player rushing",
    type: ConditionType.Number,
    targets: [],
    targetSource: "game.players"
  },

  [FootballEvents.PlayerReceiving]: {
    sport: 'football',
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    label: "Player receiving",
    targets: [],
    targetSource: "game.players"
  },


}
