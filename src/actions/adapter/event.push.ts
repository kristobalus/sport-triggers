
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../fleet-app'
import { AdapterPushRequest } from '../../models/dto/adapter-push-request'
import { isSignedRequest } from "../../plugins/signed-request.plugin"

async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { event } = request.params as AdapterPushRequest
  const { queueService, log } = this

  try {
    await queueService.addEvent(event)
  } catch (err) {
    log.error(err)
  }

  return { ok: true }
}

Handler.schema = 'adapter.event.push'
Handler.allowed = isSignedRequest
Handler.transports = [ActionTransport.http]

export = Handler

