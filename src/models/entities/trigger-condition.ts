import { AdapterEvent } from '../events/adapter-event'

export enum ConditionType {
  SetAndCompare = 'set_and_compare',
  IncrAndCompare = 'incr_and_compare',
  SetAndCompareAsString = 'set_and_compare_as_string'
}

export enum CompareOp {
  Equal = 'eq',
  LessThan = 'lt',
  GreaterThan = 'gt',
  LessOrEqual = 'le',
  GreaterOrEqual = 'ge'
}

export enum ChainOp {
  AND = 'and',
  OR = 'or'
}

export interface TriggerConditionOption {
  event: string
  compare: CompareOp
  target: string
  type?: string
}

export interface TriggerCondition {
  // uuid generated for each condition
  id: string
  // owner id
  triggerId: string
  // datasource
  datasource: string
  // name of event to be compared with
  event: string
  // scope of event
  scope: string
  // scope identifier
  scopeId: string
  // comparison operation, should be used to compare "current" and "target" and return a boolean
  compare: CompareOp
  // type of condition
  type: ConditionType
  uri: string
  // target value of the event, threshold value to compare with
  target: string
  // current value read from event
  current?: string
  // true when compare(target, current) == true
  activated?: boolean
  // log of events consumed by condition
  log?: AdapterEvent[]
  // order of occurrence of condition in array of conditions
  chainOrder?: number
  // logical operation on condition when combining multiple conditions together
  chainOperation?: ChainOp
  // condition options
  options: TriggerConditionOption[]
}
