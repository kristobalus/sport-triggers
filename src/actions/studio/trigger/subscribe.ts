
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"

async function SubscribeHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService } = this

  await studioService.subscribeTrigger(data)

  return { ok: true }
}

SubscribeHandler.schema = 'trigger.subscribe'
SubscribeHandler.transports = [ActionTransport.amqp]

export = SubscribeHandler

