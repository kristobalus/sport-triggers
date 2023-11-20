
import { Trigger } from '../entities/trigger'
import { TriggerCondition } from '../entities/trigger-condition'

export interface TriggerUpdate {
  trigger: Trigger
  conditions: TriggerCondition[]
  limits: Record<string, number>
}

export interface TriggerUpdateRequest {
  updates: TriggerUpdate[]
}
