import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { AdapterService } from '../services/adapter/adapter.service'
import { getQueueRedisConfig, QueueService } from '../services/queue/queue.service'

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    const { log, redis, amqp, config } = parent
    const { triggerLifetimeSeconds } = config.triggers

    parent.adapterService = new AdapterService(log, redis, amqp, { triggerLifetimeSeconds })
    parent.queueService = new QueueService(log, parent.adapterService, getQueueRedisConfig(config.redis))
  })

  // eslint-disable-next-line require-await
  parent.addDestructor(ConnectorsTypes.application, async () => {
    await parent.queueService.close()
  })
}

// export function getService(): AdapterService {
//   if (instance) {
//     return instance
//   }
//
//   throw new Error('AdapterService is not initialized')
// }
