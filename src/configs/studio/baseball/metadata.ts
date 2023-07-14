import { CompareOp, ConditionType } from '../../../models/entities/trigger-condition'
import { EventMetadata } from "../../../models/events/event-metadata"
import { AtBatOutcomeState, BaseballEvents, GameState, PitchOutcomeState } from "./baseball-events"
import { Sources } from "./sources"
import { StudioInputs } from "../../../models/studio/studio.inputs"
import { CommonSources } from "../common-sources"

export const metadata: Record<string, EventMetadata> = {

  [BaseballEvents.Inning]: {
    sport: 'baseball',
    label: 'Inning',
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterOrEqual,
      CompareOp.GreaterThan,
      CompareOp.LessThan,
      CompareOp.LessOrEqual
    ],
    targets: []
  },

  // expects player-id in targets
  [BaseballEvents.Player]: {
    sport: 'baseball',
    label: 'Player',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [],
    targetSource: CommonSources.GamePlayers
  },

  // expects team-id in targets
  [BaseballEvents.Team]: {
    sport: 'baseball',
    label: 'Team',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [],
    targetSource: CommonSources.GameTeams
  },

  [BaseballEvents.BallSpeed]: {
    sport: 'baseball',
    label: 'Ball speed',
    disabled: false,
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterOrEqual,
      CompareOp.GreaterThan,
      CompareOp.LessOrEqual,
      CompareOp.LessThan
    ],
    preferredOptions: []
  },

  [BaseballEvents.ScoreDifferential]: {
    sport: 'baseball',
    label: 'Score differential',
    disabled: false,
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterOrEqual,
      CompareOp.GreaterThan,
      CompareOp.LessOrEqual,
      CompareOp.LessThan
    ],
    preferredOptions: []
  },

  [BaseballEvents.HomeScore]: {
    sport: 'baseball',
    label: 'Home score',
    disabled: false,
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterOrEqual,
      CompareOp.GreaterThan,
      CompareOp.LessOrEqual,
      CompareOp.LessThan
    ],
    preferredOptions: []
  },

  [BaseballEvents.AwayScore]: {
    sport: 'baseball',
    label: 'Away score',
    disabled: false,
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterOrEqual,
      CompareOp.GreaterThan,
      CompareOp.LessOrEqual,
      CompareOp.LessThan
    ],
    preferredOptions: []
  },

  [BaseballEvents.GameState]: {
    sport: 'baseball',
    label: 'Game state',
    disabled: false,
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [
      GameState.GameStart,
      GameState.GameEnd,
      GameState.InningStart,
      GameState.InningEnd,
    ],
    targetSource: Sources.GameStates,
    preferredOptions: []
  },

  // expects player-id in targets
  [BaseballEvents.PlayerAtBat]: {
    sport: 'baseball',
    label: 'Player at Bat',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [],
    targetSource: CommonSources.GamePlayers,
    preferredOptions: [
      BaseballEvents.AtBatOutcome,
      BaseballEvents.PitchOutcome,
    ]
  },

  // expects player-id in targets
  [BaseballEvents.PlayerPitch]: {
    sport: 'baseball',
    label: 'Player pitching',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [],
    targetSource: CommonSources.GamePlayers,
    preferredOptions: [
      BaseballEvents.PitchOutcome,
      BaseballEvents.AtBatOutcome,
    ],
  },

  // expects team-id in targets
  [BaseballEvents.TeamAtBat]: {
    sport: 'baseball',
    label: 'Team at Bat',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [],
    targetSource: CommonSources.GameTeams,
    preferredOptions: [
      BaseballEvents.AtBatOutcome,
      BaseballEvents.PitchOutcome,
    ],
  },

  // expects team-id in targets
  [BaseballEvents.TeamPitch]: {
    sport: 'baseball',
    label: 'Team pitching',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [],
    targetSource: CommonSources.GameTeams,
    preferredOptions: [
      BaseballEvents.AtBatOutcome,
      BaseballEvents.PitchOutcome,
    ]
  },

  [BaseballEvents.PitchOutcome]: {
    sport: 'baseball',
    label: 'Pitch outcome',
    input: StudioInputs.Select,
    type: ConditionType.String,
    primary: false,
    compare: [
      CompareOp.Equal
    ],
    targetSource: Sources.PitchOutcome,
    targets: [
      PitchOutcomeState.Ball,
      PitchOutcomeState.BallInPlay,
      PitchOutcomeState.GT99,
      PitchOutcomeState.LT80,
      PitchOutcomeState.Foul,
      PitchOutcomeState.StrikeLooking,
      PitchOutcomeState.StrikeSwinging
    ]
  },

  [BaseballEvents.AtBatOutcome]: {
    sport: 'baseball',
    label: 'At Bat outcome',
    input: StudioInputs.Select,
    type: ConditionType.String,
    primary: false,
    compare: [
      CompareOp.Equal
    ],
    targets: [
      AtBatOutcomeState.GIDP,
      AtBatOutcomeState.BB,
      AtBatOutcomeState.BI,
      AtBatOutcomeState.ERR,
      AtBatOutcomeState.FO,
      AtBatOutcomeState.CI,
      AtBatOutcomeState.GO,
      AtBatOutcomeState.XBH,
      AtBatOutcomeState.X1,
      AtBatOutcomeState.X2,
      AtBatOutcomeState.X3,
      AtBatOutcomeState.REACH,
      AtBatOutcomeState.RBI,
      AtBatOutcomeState.OUT,
      AtBatOutcomeState.KS,
      AtBatOutcomeState.IPO,
      AtBatOutcomeState.KL,
      AtBatOutcomeState.K,
      AtBatOutcomeState.HIT,
      AtBatOutcomeState.HR,
      AtBatOutcomeState.HBP
    ],
    targetSource: Sources.AtBatOutcome
  },


}
