import { CompareOp, ConditionType } from '../../../models/entities/trigger-condition'
import { EventMetadata } from "../../../models/events/event-metadata"
import { BasketballEvents } from "./basketball-events"
import { GameLevel } from "./game-level"
import { StudioInputs } from "../../../models/studio/studio.inputs"
import { CommonSources } from "../common-sources"

export const metadata: Record<string, EventMetadata> = {

  [BasketballEvents.GameLevel]: {
    sport: 'basketball',
    input: StudioInputs.Select,
    primary: true,
    label: "Game level",
    type: ConditionType.String,
    compare: [
      CompareOp.Equal,
    ],
    targets: [
      GameLevel.Start,
      GameLevel.End,
      GameLevel.HalfStart,
      GameLevel.HalfEnd,
      GameLevel.QuarterStart,
      GameLevel.QuarterEnd,
    ],
  },

  [BasketballEvents.Quarter]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: true,
    label: "Period quarter number",
    description: "should be number",
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
  },

  [BasketballEvents.Sequence]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: true,
    label: "Period sequence number",
    description: "should be number",
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
  },

  [BasketballEvents.GamePointsHome]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: true,
    label: "Period sequence number",
    description: "should be number",
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
  },

  [BasketballEvents.GamePointsAway]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: true,
    label: "Period sequence number",
    description: "should be number",
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
  },

  [BasketballEvents.Player]: {
    sport: 'basketball',
    input: StudioInputs.SelectMulti,
    primary: true,
    label: "Player",
    description: "should be player id",
    type: ConditionType.String,
    compare: [
      CompareOp.In,
    ],
    targetSource: CommonSources.GamePlayers,
    targets: [],
  },

  [BasketballEvents.TeamShootingFoul]: {
    sport: 'basketball',
    input: StudioInputs.SelectMulti,
    primary: true,
    label: "Team shooting foul",
    description: "should be matched to team-id, multiple targets allowed",
    type: ConditionType.String,
    compare: [
      CompareOp.In,
    ],
    targetSource: CommonSources.GameTeams,
    targets: [],
  },

  [BasketballEvents.Team]: {
    sport: 'basketball',
    input: StudioInputs.SelectMulti,
    primary: true,
    label: "Team",
    description: "should be matched to team-id",
    type: ConditionType.String,
    compare: [
      CompareOp.In,
    ],
    targetSource: CommonSources.GameTeams,
    targets: [],
  },


}
