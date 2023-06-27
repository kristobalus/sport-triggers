import { ConnectorsTypes } from "@microfleet/core"

import { AdapterService } from "../services/adapter/adapter.service"
import { FleetApp } from "../fleet-app"

let instance: AdapterService

export function init(parent: FleetApp) {
  parent.addConnector(ConnectorsTypes.application, async () => {
    const { log, redis, amqp, config } = parent
    const { triggerLifetimeSeconds } = config.triggers
    
    instance = parent.adapterService = new AdapterService(log, redis, amqp, { triggerLifetimeSeconds })
  })

  parent.addDestructor(ConnectorsTypes.application, async () => {
    instance = null
  })
}

export function getService(): AdapterService {
  if (instance) {
    return instance
  }

  throw new Error(`AdapterService is not initialized`)
}
