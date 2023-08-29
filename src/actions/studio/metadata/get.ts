import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { StudioConditionData } from '../../../models/studio/studio.condition-data'
import { HttpStatusError } from "@microfleet/validation"

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { amqp, metadataService, log } = this
  const { eventId } = request.params as unknown as { eventId: string }

  log.debug({  eventId }, 'get metadata request')

  let response
  let datasource
  try {
    // resolve by amqp request
    response = await amqp.publishAndWait('sports.events.retrieveProviderId',
      { id: eventId, provider: "sportradar" },
      { reuse: true, cache: 600 })
    datasource = "sportradar"
    log.debug({  response }, 'sl-sports response with resolved provider id with sportradar')
  } catch (err) {
    log.warn({ err, eventId }, 'failed to resolve eventId in sportradar bindings')
  }

  try {
    // resolve by amqp request
    response = await amqp.publishAndWait('sports.events.retrieveProviderId',
      { id: eventId, provider: "nvenue" },
      { reuse: true, cache: 600 })
    datasource = "nvenue"
    log.debug({  response }, 'sl-sports response with resolved provider id with nvenue')
  } catch (err) {
    log.warn({ err, eventId }, 'failed to resolve eventId in nvenue bindings')
  }

  if (!response) {
    throw new HttpStatusError(404, "Metadata not found the event")
  }

  const { id: gameId } = response.data

  // create metadata
  const data: StudioConditionData = metadataService.getConditionData(datasource, gameId, true)

  log.debug({  data }, 'event ui metadata')

  return { data }
}

Handler.schema = 'studio.metadata.get'
Handler.transports = [ActionTransport.amqp]

export = Handler
