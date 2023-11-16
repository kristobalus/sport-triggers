import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { SportGetLimitsResponse } from '../../../models/dto/sport-get-limits-response'

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { log } = this
  const { metadataService } = this
  const { sport } = request.params as unknown as { sport: string }

  log.debug({ sport }, 'request for a list of limit definitions')

  const data = metadataService.getLimitsBySport(sport)

  log.debug({ data }, 'limit definition by sport')

  return { data } as SportGetLimitsResponse
}

Handler.schema = 'studio.limits.get'
Handler.transports = [ActionTransport.amqp]

export = Handler
