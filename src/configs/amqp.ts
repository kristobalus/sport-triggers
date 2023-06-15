import type { CoreOptions } from '@microfleet/core'

export const amqp: CoreOptions['amqp'] = {
  transport: {
    queue: 'fleet-service',
    bindPersistantQueueToHeadersExchange: true,
  },
}

export const routerAmqp: CoreOptions['routerAmqp'] = {
  prefix: 'fleet-service',
}
