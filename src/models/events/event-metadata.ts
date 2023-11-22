import { CompareOp, ConditionType } from '../entities/trigger-condition'
import { StudioInputs } from '../studio/studio.inputs'

export interface EventMetadata {
  sport: string
  primary: boolean
  input: StudioInputs
  label: string
  description?: string
  disabled?: boolean
  targets?: (string | number)[]
  childOptions?: string[]
  targetSource?: string
  compare?: string[]
  type: ConditionType
  // if true for empty targets should use default targets from scope
  inferTargetsFromParent?: boolean
  // list of events which can be the scope of aggregation
  parentOption?: string
  defaultCompare?: CompareOp
  // list of targets to be used for aggregation
  aggregate?: (datasource: string, sport: string, scope: string, scopeId: string, targets: string[]) => string[]
}
