import { CoreOptions } from '@microfleet/core'

export const notifier: CoreOptions['notifier'] = {
  enabled: true,
  debounce: 1000,
  transport: { exchange: 'streamlayer.broadcast' },
}
