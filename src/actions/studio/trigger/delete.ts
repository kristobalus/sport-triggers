
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"

async function DeleteHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService } = this

  await studioService.deleteTrigger(data)

  return { ok: true }
}

DeleteHandler.schema = 'trigger.delete'
DeleteHandler.transports = [ActionTransport.amqp]

export = DeleteHandler

