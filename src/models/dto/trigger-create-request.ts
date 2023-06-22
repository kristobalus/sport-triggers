import { Trigger } from "../entities/trigger"
import { TriggerCondition } from "../entities/trigger-condition"

export type EssentialTriggerData = Pick<Trigger,
  "name" | "description" | "datasource" | "scope" | "scopeId" | "entity" | "entityId" >

export type EssentialConditionData = Pick<TriggerCondition,
  "event" | "compare" | "chainOperation" | "target">

export interface TriggerCreateRequest {
  trigger: EssentialTriggerData
  conditions: EssentialConditionData[]
}
