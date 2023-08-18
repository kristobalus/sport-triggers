
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../fleet-app'
import { AdapterPushRequest } from '../../models/dto/adapter-push-request'
import { signedRequestMiddleware } from "../../middleware/signed-request.middleware"

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
Handler.allowed = signedRequestMiddleware
Handler.transports = [ActionTransport.http]

export = Handler

