
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../fleet-app'
import { AdapterPushRequest } from '../../models/dto/adapter-push-request'
import { allowSignedRequest } from '../../plugins/signed-request.plugin'

async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { event } = request.params as AdapterPushRequest
  const { queueService, log } = this

  log.debug({ event }, `received pushed event from adapter`)

  try {
    await queueService.addAdapterEvent(event)
  } catch (err) {
    log.error({ err }, `error while writing to bullmq`)
  }

  return { ok: true }
}

Handler.schema = 'adapter.event.push'
Handler.allowed = allowSignedRequest
Handler.transports = [ActionTransport.http]

export = Handler

