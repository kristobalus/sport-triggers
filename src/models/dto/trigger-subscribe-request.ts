import { TriggerSubscription } from '../entities/trigger-subscription'

export type EssentialSubscriptionData = Partial<Pick<TriggerSubscription,
  'route' | 'payload' | 'options' | 'entity' | 'entityId' >>

export interface TriggerSubscribeRequest {
  triggerId: string
  subscription: EssentialSubscriptionData
}

