
export interface TriggerSubscription {
  id: string
  triggerId: string
  route: string
  // JSON document
  payload: Record<string, any>
  options: Record<string, any>
}

// First, we 'Omit' the 'payload' and 'options' properties from 'TriggerSubscription'
type TriggerSubscriptionWithoutPayloadAndOptions = Omit<TriggerSubscription, 'payload' | 'options'>;

// Then, we create the new interface by extending the one we've just created
export interface SerializedTriggerSubscription extends Partial<TriggerSubscriptionWithoutPayloadAndOptions> {
  payload?: string
  options?: string
}

export type CreateSubscriptionData = Partial<Pick<TriggerSubscription, "route" | "payload" | "options">>
