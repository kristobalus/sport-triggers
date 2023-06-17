
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"

async function UnsubscribeHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService } = this

  await studioService.unsubscribeTrigger(data)

  return { ok: true }
}

UnsubscribeHandler.schema = 'trigger.unsubscribe'
UnsubscribeHandler.transports = [ActionTransport.amqp]

export = UnsubscribeHandler

