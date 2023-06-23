import { ConnectorsTypes } from "@microfleet/core"

import { FleetApp } from "../fleet-app"
import { StudioService } from "../services/studio/studio.service"

let instance: StudioService

export function init(parent: FleetApp) {
  parent.addConnector(ConnectorsTypes.application, async () => {
    const { log, redis } = parent

    instance = parent.studioService = new StudioService(log, redis)
  })

  parent.addDestructor(ConnectorsTypes.application, async () => {
    instance = null
  })
}

export function getService(): StudioService {
  if (instance) {
    return instance
  }

  throw new Error(`StudioService is not initialized`)
}
