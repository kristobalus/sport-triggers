import { Trigger } from '../entities/trigger'
import { TriggerCondition } from '../entities/trigger-condition'
import { TriggerLimit } from "../entities/trigger-limit"


export interface TriggerWithConditions {
  trigger: Trigger
  conditions: TriggerCondition[]
  limits: Record<string, TriggerLimit>
}
