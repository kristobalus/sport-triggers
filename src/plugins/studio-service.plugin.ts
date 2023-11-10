import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { StudioService, StudioServiceOptions } from '../services/studio/studio.service'
import { TriggerCollection } from '../repositories/trigger.collection'
import { TriggerConditionCollection } from '../repositories/trigger-condition.collection'
import { TriggerSubscriptionCollection } from '../repositories/trigger-subscription.collection'
import { TriggerLimitCollection } from '../repositories/trigger-limit.collection'
import { EntityLimitCollection } from '../repositories/entity-limit.collection'

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    const { log, redis, config } = parent
    const { triggerLifetimeSeconds } = config.triggers

    const triggerCollection = new TriggerCollection(redis, triggerLifetimeSeconds)
    const conditionCollection = new TriggerConditionCollection(redis, triggerLifetimeSeconds)
    const subscriptionCollection = new TriggerSubscriptionCollection(redis, triggerLifetimeSeconds)
    const triggerLimitCollection = new TriggerLimitCollection(redis)
    const entityLimitCollection = new EntityLimitCollection(redis)

    parent.studioService = new StudioService({
      log,
      redis,
      triggerCollection,
      conditionCollection,
      subscriptionCollection,
      triggerLimitCollection,
      entityLimitCollection
    } as StudioServiceOptions)
  })

  // eslint-disable-next-line require-await
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  parent.addDestructor(ConnectorsTypes.application, async () => {

  })
}

