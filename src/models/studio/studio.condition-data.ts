import { StudioEvent } from "./studio.event"
import { StudioTarget } from "./studio.target"

export interface TargetList {
  targets: StudioTarget[]
}

export interface StudioConditionData {
  index: string[]
  events: Record<string, StudioEvent>,
  sources: Record<string, TargetList>
}
