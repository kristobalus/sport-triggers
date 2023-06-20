import { Trigger } from "../entities/trigger"
import { TriggerCondition } from "../entities/trigger-condition"

export type CreateTriggerData = Pick<Trigger, "name" | "description" | "datasource" | "scope" | "scopeId">

export interface TriggerCreateRequest {
  trigger: CreateTriggerData,
  conditions?: Partial<TriggerCondition>[]
}
