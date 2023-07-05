import { CompareOp, ConditionType } from '../../entities/trigger-condition'
import { EventMetadata } from "../event-metadata"
import { BasketballEvents } from "./basketball-events"
import { GameLevel } from "./basketball-game-level.event"

export const metadata: Record<string, EventMetadata> = {

  [BasketballEvents.GameLevel]: {
    sport: 'basketball',
    input: false,
    type: ConditionType.SetAndCompareAsString,
    compare: [
      CompareOp.Equal
    ],
    targets: [
      GameLevel.Start,
      GameLevel.End,
      GameLevel.HalfStart,
      GameLevel.HalfEnd,
      GameLevel.QuarterStart,
      GameLevel.QuarterEnd
    ]
  }

}
