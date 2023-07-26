import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { StudioConditionData } from "../../../models/studio/studio.condition-data"

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { amqp, metadataService, log } = this
  const { eventId, sport } = request.params as unknown as { eventId: string, sport: string }

  log.debug({  eventId, sport }, `get metadata request`)

  // resolve by amqp request
  const response = await amqp.publishAndWait("sports.events.retrieveProviderId",
    { id: eventId, provider: metadataService.getDatasource() },
    { reuse: true, cache: 600 })

  log.debug({  response }, `sl-sports response with resolved provider id`)

  const { id: gameId } = response.data

  // create metadata
  const data: StudioConditionData = metadataService.getConditionData(gameId, sport)

  log.debug({  data }, `event ui metadata`)

  return { data }
}

Handler.schema = 'studio.metadata.get'
Handler.transports = [ActionTransport.amqp]

export = Handler
