import { Trigger } from '../entities/trigger'
import { TriggerCondition } from '../entities/trigger-condition'

export type EssentialTriggerData = Pick<Trigger,
  'name' | 'description' | 'scope' | 'scopeId' | 'entity' | 'entityId' | 'datasource' >

export type EssentialConditionData = Pick<TriggerCondition,
  'event' | 'compare' | 'chainOperation' | 'targets' | 'options'>

export interface TriggerCreateRequest {
  trigger: EssentialTriggerData
  conditions: EssentialConditionData[]
}
