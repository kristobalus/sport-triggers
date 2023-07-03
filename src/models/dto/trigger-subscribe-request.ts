import { TriggerSubscription } from '../entities/trigger-subscription'

export type EssentialSubscriptionData = Pick<TriggerSubscription,
  'route' | 'payload' > & Partial<Pick<TriggerSubscription, 'options' | 'entity' | 'entityId'>>

export interface TriggerSubscribeRequest {
  triggerId: string
  subscription: EssentialSubscriptionData
}

