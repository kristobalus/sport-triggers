import { CompareOp, ConditionType } from '../../../models/entities/trigger-condition'
import { EventMetadata } from "../../../models/events/event-metadata"
import { AtBatOutcomeState, BaseballEvents, PitchOutcomeState } from "./baseball-events"
import { TargetSources } from "./target-sources"
import { StudioInputs } from "../../../services/studio/studio-inputs"

export const metadata: Record<string, EventMetadata> = {

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
    targetSource: "game.players",
    secondary: [
      BaseballEvents.AtBatOutcome,
      BaseballEvents.PitchOutcome,
    ]
  },

  // expects player-id in targets
  [BaseballEvents.PlayerPitching]: {
    sport: 'baseball',
    label: 'Player pitching',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [],
    targetSource: "game.players",
    secondary: [
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
    targetSource: "game.teams",
    secondary: [
      BaseballEvents.AtBatOutcome,
      BaseballEvents.PitchOutcome,
    ],
  },

  // expects team-id in targets
  [BaseballEvents.TeamPitching]: {
    sport: 'baseball',
    label: 'Team pitching',
    input: StudioInputs.SelectMulti,
    type: ConditionType.String,
    primary: true,
    compare: [
      CompareOp.In
    ],
    targets: [],
    targetSource: "game.teams",
    secondary: [
      BaseballEvents.AtBatOutcome,
      BaseballEvents.PitchOutcome,
    ]
  },

  // expects team-id in targets
  [BaseballEvents.PitchOutcome]: {
    sport: 'baseball',
    label: 'Pitch outcome',
    input: StudioInputs.Select,
    type: ConditionType.String,
    primary: false,
    compare: [
      CompareOp.Equal
    ],
    targetSource: TargetSources.PitchOutcome,
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

  // expects team-id in targets
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
    targetSource: TargetSources.AtBatOutcome
  },


}
