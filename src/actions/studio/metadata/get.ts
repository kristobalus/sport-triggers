import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { StudioConditionData } from "../../../models/studio/studio.condition-data"

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { amqp, metadataService } = this
  const { eventId, sport } = request.params as unknown as { eventId: string, sport: string }

  // resolve by amqp request
  const response = await amqp.publishAndWait("sports.events.retrieveProviderId",
    { eventId },
    { reuse: true, cache: 600 })

  const { providerId: gameId } = response

  // create metadata
  const data: StudioConditionData = metadataService.getConditionData(gameId, sport)

  return { data }
}

Handler.schema = 'studio.metadata.get'
Handler.transports = [ActionTransport.amqp]

export = Handler
