import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { StudioService } from '../services/studio/studio.service'

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    const { log, redis, config } = parent
    const { triggerLifetimeSeconds } = config.triggers

    parent.studioService = new StudioService(log, redis, { triggerLifetimeSeconds })
  })

  // eslint-disable-next-line require-await
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  parent.addDestructor(ConnectorsTypes.application, async () => {

  })
}

