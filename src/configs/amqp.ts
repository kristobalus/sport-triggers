import type { CoreOptions } from '@microfleet/core'

export const amqp: CoreOptions['amqp'] = {
  transport: {
    queue: 'triggers',
    bindPersistantQueueToHeadersExchange: true,
  },
}

export const routerAmqp: CoreOptions['routerAmqp'] = {
  prefix: 'triggers',
}
