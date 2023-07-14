
import { StudioTarget } from "./studio.target"
import { StudioInputs } from "./studio.inputs"

export interface StudioEvent {
  id: string
  sport: string
  primary: boolean
  input: StudioInputs
  label: string
  targets?: StudioTarget[]
  preferredOptions?: string[]
  compare?: string[]
  targetSource: string
}
