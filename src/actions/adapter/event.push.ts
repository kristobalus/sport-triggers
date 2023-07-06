
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../fleet-app'
import { AdapterPushRequest } from '../../models/dto/adapter-push-request'

// TODO authorization (aka digest)
async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { event } = request.params as AdapterPushRequest

  const { queueService } = this

  // TODO add log of events even if no triggers exist
  await queueService.addEvent(event)

  return { ok: true }
}

Handler.schema = 'adapter.event.push'
Handler.transports = [ActionTransport.http]

export = Handler

