import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { amqp, metadataService } = this
  const { eventId } = request.params as unknown as { eventId: string }

  // resolve by amqp request
  const response = await amqp.publishAndWait("sports.events.retrieveProviderId",
    { eventId },
    { reuse: true, cache: 3600 })

  const { providerId: gameId } = response

  // create metadata
  const data = metadataService.getConditionData(gameId)

  return { data }
}

Handler.schema = 'studio.metadata.get'
Handler.transports = [ActionTransport.amqp]

export = Handler
