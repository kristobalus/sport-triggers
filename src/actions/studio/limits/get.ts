import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { SportGetLimitsResponse } from '../../../models/dto/sport-get-limits-response'
import { allowSignedRequest } from '../../../plugins/signed-request.plugin'

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { log } = this
  const { metadataService } = this
  const { sport } = request.params as unknown as { sport: string }

  log.debug({ sport }, 'request for a list of limit definitions by sport')

  const limits = metadataService.getLimitsBySport(sport)

  log.debug({ limits }, 'limit definition by sport')

  return { limits } as SportGetLimitsResponse
}

Handler.schema = 'studio.limits.get'
Handler.allowed = allowSignedRequest
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler
