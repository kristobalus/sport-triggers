import { ConnectorsTypes } from "@microfleet/core"

import { FleetApp } from "../fleet-app"
import { StudioService } from "../services/studio.service"

let instance: StudioService

export function init(parent: FleetApp) {

  parent.addConnector(ConnectorsTypes.application, async () => {
    instance = parent.studioService = new StudioService(parent.log)
  })

  parent.addDestructor(ConnectorsTypes.application, async () => {
    instance = null
  })
}

export function getService() : StudioService {
  if (instance) {
    return instance
  }

  throw new Error(`StudioService is not initialized`)
}
