import { Trigger } from '../entities/trigger'
import { TriggerCondition } from '../entities/trigger-condition'

export interface TriggerWithConditions {
  trigger: Trigger
  conditions: TriggerCondition[]
  limits: Record<string, number>
  counts: Record<string, number>
}
