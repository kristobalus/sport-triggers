import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { StudioService } from '../services/studio/studio.service'

let instance: StudioService

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    const { log, redis, config } = parent
    const { triggerLifetimeSeconds } = config.triggers

    instance = parent.studioService = new StudioService(log, redis, { triggerLifetimeSeconds })
  })

  // eslint-disable-next-line require-await
  parent.addDestructor(ConnectorsTypes.application, async () => {
    instance = null
  })
}

export function getService(): StudioService {
  if (instance) {
    return instance
  }

  throw new Error('StudioService is not initialized')
}
