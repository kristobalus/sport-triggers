import { CompareOp, ConditionType } from '../../models/entities/trigger-condition'
import { EventMetadata } from '../../models/events/event-metadata'
import { StudioInputs } from '../../models/studio/studio.inputs'
import { CommonSources } from '../common-sources'

import { AtBatOutcomeState, BaseballEvents, PitchOutcomeState } from './baseball-events'
import { Sources } from './sources'
import { InningHalf } from './inning-half'
// import { Sources } from './sources'

/*
    Basic scenarios:

    1) Team At Bat = Team A (or Team B ) > Atbat Outcome = Out
    ** This scenario will happen 27 times for each team (54 times total) in a game. (can be more if game goes into extended play because of a tie)

    2) Team At Bat = Team A (or Team B ) > Atbat Outcome = Hit
    ** This scenario is likely to happen on average ~8 times per team (~16 times total).  There are times when one team won't get any hits but this is very rare.

    3) Team Pitching = Team A (or Team B ) > Pitch Outcome = Strike Looking
    ** This happens probably about 15 times a game

    4) Team Pitching = Team A (or Team B ) > Pitch Outcome = Strike Swinging
    ** this happens approximately 15 times a game as well

    5) Inning Number = 1,2,3.. [ AND InningHalf = "top|bottom" ]
    ** this will happen 1 time for each inning selected.  There are usually 9 innings in a game (if it doesn't go into extended play because of a tie).
 */

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
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
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
    description: 'Batter stands a few inches to the right or ' +
      'left of home plate and attempt to put the ball in play ' +
      'against an opposing pitcher.',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    preferredOptions: [
      // see basic scenarios
      BaseballEvents.PitchOutcome,
      BaseballEvents.PitchType,
      BaseballEvents.PitchSpeed
    ],
    compare: [
      // at least one out of...
      CompareOp.In
    ],
    targets: [
      // deliberately left empty here,
      // targets will be put by studio from specified targetSource
    ],
    targetSource: CommonSources.GamePlayers
  },

  [BaseballEvents.PlayerPitcher]: {
    sport: 'baseball',
    label: 'Pitcher',
    description: 'In baseball, the pitcher is the player who throws ("pitches")' +
      ' the baseball from the pitcher\'s mound toward the catcher to ' +
      'begin each play, with the goal of retiring a batter, who attempts ' +
      'to either make contact with the pitched ball or draw a walk.',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    preferredOptions: [
      // see basic scenarios
      BaseballEvents.PitchOutcome
    ],
    compare: [
      // at least one out of...
      CompareOp.In
    ],
    targets: [
      // deliberately left empty here,
      // targets will be put by studio from specified targetSource
    ],
    targetSource: CommonSources.GamePlayers
  },

  [BaseballEvents.TeamBatter]: {
    sport: 'baseball',
    label: 'Team At Bat',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      // at least one out of...
      CompareOp.In
    ],
    preferredOptions: [
      // see basic scenario
      BaseballEvents.AtBatOutcome
    ],
    targets: [
      // deliberately left empty here,
      // targets will be put by studio from specified targetSource
    ],
    targetSource: CommonSources.GameTeams
  },

  [BaseballEvents.TeamPitcher]: {
    sport: 'baseball',
    label: 'Team of pitcher',
    input: StudioInputs.Select,
    type: ConditionType.String,
    primary: true,
    compare: [
      // at least one out of...
      CompareOp.In
    ],
    preferredOptions: [
      // see basic scenarios
      BaseballEvents.PitchOutcome
    ],
    targets: [
      // deliberately left empty here,
      // targets will be put by studio from specified targetSource
    ],
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

  [BaseballEvents.PitchOutcome]: {
    sport: 'baseball',
    label: 'Pitch Outcome',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.In
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

  [BaseballEvents.PitchSpeed]: {
    sport: 'baseball',
    label: 'Pitch speed',
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
    targets: [
      // number input expected, no predefined targets
    ]
  },

  [BaseballEvents.PitchType]: {
    sport: 'baseball',
    label: 'Pitch type, unknown targets (TODO)',
    input: StudioInputs.String,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.GreaterOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
    ],
    targets: [
      // number input expected, no predefined targets
    ]
  },

  [BaseballEvents.AtBatOutcome]: {
    sport: 'baseball',
    label: 'AtBat Outcome',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.Equal,
      CompareOp.In
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
