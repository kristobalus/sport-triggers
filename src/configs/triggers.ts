import { AdapterConfig, TriggerConfig } from '../module'

export const triggers: TriggerConfig = {
  // shows how long data about trigger will be kept after activation
  triggerLifetimeSeconds: 86_400 * 2
}

export const adapter: AdapterConfig = {
  digestApiKey: process.env.TRIGGER_API_KEY,
  digestAlgorithm: 'sha256',
  digestHeader: 'X-Custom-Digest'
}
