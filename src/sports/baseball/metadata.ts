import { CompareOp, ConditionType } from '../../models/entities/trigger-condition'
import { EventMetadata } from '../../models/events/event-metadata'
import { StudioInputs } from '../../models/studio/studio.inputs'
import { CommonSources } from '../common-sources'

import { BaseballEvents } from './baseball-events'
import { Sources } from './sources'
import { InningHalf } from './inning-half'
// import { Sources } from './sources'

export const metadata: Record<string, EventMetadata> = {

  [BaseballEvents.InningNumber]: {
    sport: 'baseball',
    label: 'Inning number',
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterOrEqual,
      CompareOp.GreaterThan,
      CompareOp.LessThan,
      CompareOp.LessOrEqual
    ]
  },

  [BaseballEvents.InningHalf]: {
    sport: 'baseball',
    label: 'Inning-half',
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
    targets: [
      InningHalf.Top,
      InningHalf.Bottom
    ],
    targetSource: Sources.InningHalf
  },

  // expects player-id in targets
  [BaseballEvents.PlayerBatter]: {
    sport: 'baseball',
    label: 'Batter',
    description: 'Batter stands a few inches to the right or left of home plate and attempt to put the ball in play against an opposing pitcher.',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targetSource: CommonSources.GamePlayers
  },

  // expects team-id in targets
  [BaseballEvents.PlayerPitcher]: {
    sport: 'baseball',
    label: 'Pitcher',
    description: 'In baseball, the pitcher is the player who throws ("pitches") the baseball from the pitcher\'s mound toward the catcher to begin each play, with the goal of retiring a batter, who attempts to either make contact with the pitched ball or draw a walk.',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targetSource: CommonSources.GamePlayers
  },

  [BaseballEvents.TeamBatter]: {
    sport: 'baseball',
    label: 'Team of batter',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    preferredOptions: [],
    targets: [],
    targetSource: CommonSources.GameTeams
  },

  // expects player-id in targets
  [BaseballEvents.TeamPitcher]: {
    sport: 'baseball',
    label: 'Team of pitcher',
    input: StudioInputs.Select,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    preferredOptions: [],
    targets: [],
    targetSource: CommonSources.GameTeams
  },

  [BaseballEvents.ScoreDifferential]: {
    sport: 'baseball',
    label: 'Score differential',
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

  [BaseballEvents.ScoreHome]: {
    sport: 'baseball',
    label: 'Home score',
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

  [BaseballEvents.ScoreAway]: {
    sport: 'baseball',
    label: 'Away score',
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

  [BaseballEvents.GameStateBalls]: {
    sport: 'baseball',
    label: 'Game state balls',
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.GreaterOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
    ],
    targets: [],
    preferredOptions: []
  },

  // expects player-id in targets
  [BaseballEvents.GameStateOut]: {
    sport: 'baseball',
    label: 'Game state out',
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.GreaterOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
    ],
    targets: [],
    preferredOptions: [],
  },

  // expects team-id in targets
  [BaseballEvents.GameStatePitches]: {
    sport: 'baseball',
    label: 'Game state pitches',
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.GreaterOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
    ],
    targets: [],
    preferredOptions: [],
  },

  // expects team-id in targets
  [BaseballEvents.GameStateStrikes]: {
    sport: 'baseball',
    label: 'Game state strikes',
    input: StudioInputs.Number,
    type: ConditionType.Number,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.GreaterOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
    ],
    targets: [],
    preferredOptions: []
  },

  // [BaseballEvents.PitchOutcome]: {
  //   sport: 'baseball',
  //   label: 'Pitch outcome',
  //   input: StudioInputs.Select,
  //   type: ConditionType.String,
  //   primary: false,
  //   compare: [
  //     CompareOp.Equal
  //   ],
  //   targetSource: Sources.PitchOutcome,
  //   targets: [
  //     PitchOutcomeState.Ball,
  //     PitchOutcomeState.BallInPlay,
  //     PitchOutcomeState.GT99,
  //     PitchOutcomeState.LT80,
  //     PitchOutcomeState.Foul,
  //     PitchOutcomeState.StrikeLooking,
  //     PitchOutcomeState.StrikeSwinging
  //   ]
  // },

  // [BaseballEvents.AtBatOutcome]: {
  //   sport: 'baseball',
  //   label: 'At Bat outcome',
  //   input: StudioInputs.Select,
  //   type: ConditionType.String,
  //   primary: false,
  //   compare: [
  //     CompareOp.Equal
  //   ],
  //   targets: [
  //     AtBatOutcomeState.GIDP,
  //     AtBatOutcomeState.BB,
  //     AtBatOutcomeState.BI,
  //     AtBatOutcomeState.ERR,
  //     AtBatOutcomeState.FO,
  //     AtBatOutcomeState.CI,
  //     AtBatOutcomeState.GO,
  //     AtBatOutcomeState.XBH,
  //     AtBatOutcomeState.X1,
  //     AtBatOutcomeState.X2,
  //     AtBatOutcomeState.X3,
  //     AtBatOutcomeState.REACH,
  //     AtBatOutcomeState.RBI,
  //     AtBatOutcomeState.OUT,
  //     AtBatOutcomeState.KS,
  //     AtBatOutcomeState.IPO,
  //     AtBatOutcomeState.KL,
  //     AtBatOutcomeState.K,
  //     AtBatOutcomeState.HIT,
  //     AtBatOutcomeState.HR,
  //     AtBatOutcomeState.HBP
  //   ],
  //   targetSource: Sources.AtBatOutcome
  // },

}
