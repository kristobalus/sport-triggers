
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"

async function CreateHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService } = this

  await studioService.createTrigger(data)

  return { ok: true }
}

CreateHandler.schema = 'trigger.create'
CreateHandler.transports = [ActionTransport.amqp]

export = CreateHandler

