

import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../fleet-app"

async function SubscribeTriggerHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService } = this
  await studioService.subscribeTrigger(data)

  return { ok: true }
}

SubscribeTriggerHandler.schema = 'studio.trigger.subscribe'
SubscribeTriggerHandler.transports = [ActionTransport.amqp]

export = SubscribeTriggerHandler

