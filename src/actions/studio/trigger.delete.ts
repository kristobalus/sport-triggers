
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../fleet-app"

async function CreateTriggerHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService } = this
  await studioService.deleteTrigger(data)

  return { ok: true }
}

CreateTriggerHandler.schema = 'studio.trigger.delete'
CreateTriggerHandler.transports = [ActionTransport.amqp]

export = CreateTriggerHandler

