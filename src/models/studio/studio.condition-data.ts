import { StudioEvent } from "./studio.event"
import { StudioTargetTree } from "./studio.target-tree"

export interface StudioConditionData {
  index: string[]
  events: Record<string, StudioEvent>,
  sources: StudioTargetTree
}
