import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { StudioConditionData } from '../../../models/studio/studio.condition-data'

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { amqp, metadataService, log } = this
  const { eventId } = request.params as unknown as { eventId: string }

  log.debug({  eventId }, 'get metadata request')

  // resolve by amqp request
  const response = await amqp.publishAndWait('sports.events.retrieveProviderId',
    { id: eventId, provider: metadataService.getDatasource() },
    { reuse: true, cache: 600 })

  log.debug({  response }, 'sl-sports response with resolved provider id')

  const { id: gameId } = response.data

  // create metadata
  const data: StudioConditionData = metadataService.getConditionData(gameId, true)

  log.debug({  data }, 'event ui metadata')

  return { data }
}

Handler.schema = 'studio.metadata.get'
Handler.transports = [ActionTransport.amqp]

export = Handler
