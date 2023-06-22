import { BaseEvent } from "../events/base.event"

export enum ConditionType {
  SetAndCompare = "set_and_compare",
  IncrAndCompare = "incr_and_compare",
  SetAndCompareAsString = "set_and_compare_as_string"
}

export enum CompareOp {
  Equal="eq",
  LessThan="lt",
  GreaterThan="gt",
  LessOrEqual="le",
  GreaterOrEqual="ge"
}

export enum ChainOp {
  AND="and",
  OR="or"
}

export interface TriggerCondition {
  // uuid generated for each condition
  id: string
  // owner id
  triggerId: string
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
  // target value of the event, threshold value to compare with
  target: string | number
  // current value read from event
  current?: string | number
  // true when compare(target, current) == true
  activated?: boolean
  // log of events consumed by condition
  log?: Record<string, BaseEvent>
  // order of occurrence of condition in array of conditions
  chainOrder: number
  // logical operation on condition when combining multiple conditions together
  chainOperation: ChainOp
}
