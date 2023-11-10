import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { log } = this
  const { metadataService } = this
  const { sport } = request.params as unknown as { sport: string }

  log.debug({ sport }, 'request for a list of limits')

  const data = metadataService.getLimitsBySport(sport)

  log.debug({ data }, 'trigger limits by sport')

  return { data }
}

Handler.schema = 'studio.limits.get'
Handler.transports = [ActionTransport.amqp]

export = Handler
