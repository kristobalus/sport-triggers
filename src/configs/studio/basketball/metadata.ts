import { CompareOp, ConditionType } from '../../../models/entities/trigger-condition'
import { EventMetadata } from "../../../models/events/event-metadata"
import { BasketballEvents } from "./basketball-events"
import { GameLevel } from "./game-level"
import { StudioInputs } from "../../../services/studio/studio-inputs"

export const metadata: Record<string, EventMetadata> = {

  [BasketballEvents.GameLevel]: {
    sport: 'basketball',
    input: StudioInputs.Select,
    primary: true,
    label: "Game level",
    type: ConditionType.String,
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
