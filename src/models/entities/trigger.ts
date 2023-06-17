import { TriggerCondition } from "./trigger-condition"

export interface Trigger {
  // uuid generated for each trigger
  id: string
  // human-readable name just for description purposes
  name: string
  // human-readable name just for description purposes
  description: string
  datasource: "sportradar"
  scope: "game"
  scopeId: string
  conditions?: Partial<TriggerCondition>[]
}

