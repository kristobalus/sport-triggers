
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"

async function ListHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService  } = this

  await studioService.searchTriggers(data)

  return { ok: true }
}

ListHandler.schema = 'trigger.list'
ListHandler.transports = [ActionTransport.amqp, ActionTransport.http]

export = ListHandler

