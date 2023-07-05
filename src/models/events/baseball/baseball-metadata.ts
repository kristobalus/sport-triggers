import { CompareOp, ConditionType } from '../../entities/trigger-condition'
import { EventMetadata } from "../event-metadata"
import { BaseballEvents } from "./baseball-events"

export const metadata: Record<string, EventMetadata> = {

  [BaseballEvents.GamePointsHome]: {
    sport: 'baseball',
    input: true,
    type: ConditionType.SetAndCompareAsString,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterThan,
      CompareOp.LessThan,
      CompareOp.GreaterOrEqual,
      CompareOp.LessOrEqual
    ],
    targets: []
  },

  [BaseballEvents.GamePointsAway]: {
    sport: 'baseball',
    input: true,
    type: ConditionType.SetAndCompareAsString,
    compare: [
      CompareOp.Equal,
      CompareOp.GreaterThan,
      CompareOp.LessThan,
      CompareOp.GreaterOrEqual,
      CompareOp.LessOrEqual
    ],
    targets: []
  },



}
