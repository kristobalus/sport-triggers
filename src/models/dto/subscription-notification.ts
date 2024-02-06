
export interface SubscriptionNotification {
  payload: Record<string, any>
  limits?: Record<string, number>
  next?: boolean
  counts?: Record<string, number>
  triggerId?: string
  entity?: string
  entityId?: string
  scope?: string
  scopeId?: string
}
