import { ConditionType } from '../entities/trigger-condition'

export interface EventMetadata {
  sport: string
  primary: boolean
  input: string
  label: string
  targets?: string[]
  secondary?: string[]
  targetSource?: string;
  compare?: string[]
  type: ConditionType
}
