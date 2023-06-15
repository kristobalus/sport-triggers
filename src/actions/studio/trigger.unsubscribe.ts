

import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../fleet-app"

async function UnsubscribeTriggerHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService } = this
  await studioService.unsubscribeTrigger(data)

  return { ok: true }
}

UnsubscribeTriggerHandler.schema = 'studio.trigger.unsubscribe'
UnsubscribeTriggerHandler.transports = [ActionTransport.amqp]

export = UnsubscribeTriggerHandler

