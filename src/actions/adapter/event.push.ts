
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../fleet-app"

async function EventPushHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { event } = request.params as any

  const { adapterService } = this

  await adapterService.pushEvent(event)

  return { ok: true }
}

EventPushHandler.schema = 'event.push'
EventPushHandler.transports = [ActionTransport.http]

export = EventPushHandler

