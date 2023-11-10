

export interface TriggerSetLimitsRequest {
  triggerId: string
  limits: Record<string, number | string>
}
