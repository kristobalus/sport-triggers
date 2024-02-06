import { TriggerConfig } from '../module'
import { CommonLimit } from '../sports/common-limits'

export const triggers: TriggerConfig = {
  // shows how long data about trigger will be kept after activation
  triggerLifetimeSeconds: 86_400 * 2,
  defaultLimits: {
    [CommonLimit.Scope]: 1
  }
}
