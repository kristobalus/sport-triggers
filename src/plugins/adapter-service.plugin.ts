import { ConnectorsTypes } from "@microfleet/core"

import { AdapterService } from "../services/adapter.service"
import { FleetApp } from "../fleet-app"

let instance: AdapterService

export function init(parent: FleetApp) {

  parent.addConnector(ConnectorsTypes.application, async () => {
    instance = parent.adapterService = new AdapterService(parent.log)
  })

  parent.addDestructor(ConnectorsTypes.application, async () => {
    instance = null
  })
}

export function getService() : AdapterService {
  if (instance) {
    return instance
  }

  throw new Error(`AdapterService is not initialized`)
}
