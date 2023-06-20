import { BaseEvent } from "../events/base.event"

export interface TriggerCondition {
  // uuid generated for each condition
  id: string
  // owner id
  triggerId: string
  // name of event to be compared with
  event: string
  scope: string
  scopeId: string
  // comparison operation, should be used to compare "current" and "target" and return a boolean
  compare: "eq" | "lt" | "gt" | "le" | "ge"
  // type of condition
  type: "set-and-compare" | "incr-and-compare"
  // target value of the event, threshold value to compare with
  target: string | number
  // current value read from event
  current: string | number
  // true when compare(target, current) == true
  activated: boolean
  // log of events consumed by condition
  log: Record<string, BaseEvent>
}

// export type TriggerConditionImmutable = Pick<TriggerCondition, "id" | "triggerId" | "event" | "compare" | "type" | "target">
// export type TriggerConditionState = Pick<TriggerCondition, "current" | "activated" | "log">
