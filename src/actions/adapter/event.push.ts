
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../fleet-app'
import { AdapterPushRequest } from '../../models/dto/adapter-push-request'

async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { event } = request.params as AdapterPushRequest

  const { adapterService } = this

  await adapterService.pushEvent(event)

  return { ok: true }
}

Handler.schema = 'adapter.event.push'
Handler.transports = [ActionTransport.http]

export = Handler

