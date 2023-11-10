import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { AdapterService, AdapterServiceOptions } from '../services/adapter/adapter.service'
import { getQueueRedisConfig, QueueService } from '../services/queue/queue.service'
import { TriggerConditionCollection } from '../repositories/trigger-condition.collection'
import { TriggerSubscriptionCollection } from '../repositories/trigger-subscription.collection'
import { TriggerCollection } from '../repositories/trigger.collection'
import { ScopeSnapshotCollection } from '../repositories/scope-snapshot.collection'
import { TriggerLimitCollection } from '../repositories/trigger-limit.collection'
import { EntityLimitCollection } from '../repositories/entity-limit.collection'

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    const { log, redis, amqp, config } = parent
    const { triggerLifetimeSeconds } = config.triggers

    const conditionCollection = new TriggerConditionCollection(redis, triggerLifetimeSeconds)
    const subscriptionCollection = new TriggerSubscriptionCollection(redis)
    const triggerCollection = new TriggerCollection(redis)
    const scopeSnapshotCollection = new ScopeSnapshotCollection(redis)
    const triggerLimitCollection = new TriggerLimitCollection(redis)
    const entityLimitCollection = new EntityLimitCollection(redis)

    parent.adapterService = new AdapterService({
      log,
      redis,
      amqp,
      conditionCollection,
      subscriptionCollection,
      triggerCollection,
      scopeSnapshotCollection,
      triggerLimitCollection,
      entityLimitCollection
    } as AdapterServiceOptions)

    parent.queueService = new QueueService(
      log,
      parent.adapterService,
      getQueueRedisConfig(config.redis))
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
