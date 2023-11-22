

export interface EntitySetLimitsRequest {
  entity: string
  entityId: string
  limits: Record<string, string | number>
  enabled: boolean
}

