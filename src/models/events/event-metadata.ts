import { ConditionType } from '../entities/trigger-condition'
import { StudioInputs } from "../studio/studio.inputs"

export interface EventMetadata {
  sport: string
  primary: boolean
  input: StudioInputs
  label: string
  disabled?: boolean
  targets?: string[]
  preferredOptions?: string[]
  targetSource?: string;
  compare?: string[]
  type: ConditionType
}
