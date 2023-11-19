import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'
import { HttpStatusError } from '@microfleet/validation'

import { FleetApp } from '../../../fleet-app'
import { StudioConfigData } from '../../../models/studio/studio-config.data'
import { allowSignedRequest } from '../../../plugins/signed-request.plugin'

async function Handler(this: FleetApp, request: ServiceRequest) {
  const { amqp, metadataService, log } = this
  const { eventId } = request.params as unknown as { eventId: string }

  log.debug({  eventId }, 'get metadata request')

  let datasource
  let gameId

  try {
    // resolve by amqp request
    const response = await amqp.publishAndWait('sports.events.retrieveProviderId',
      { id: eventId, provider: 'sportradar' },
      { reuse: true, cache: 600 })

    log.debug({  response }, 'sl-sports response with resolved provider id with sportradar')

    if ( response?.data?.id ) {
      datasource = 'sportradar'
      gameId = response.data.id
    }
  } catch (err) {
    log.warn({ err, eventId }, 'failed to resolve eventId in sportradar bindings')
  }

  if ( !gameId ) {
    try {
      // resolve by amqp request
      const response = await amqp.publishAndWait('sports.events.retrieveProviderId',
        { id: eventId, provider: 'nvenue' },
        { reuse: true, cache: 600 })

      log.debug({  response }, 'sl-sports response with resolved provider id with nvenue')

      if ( response?.data?.id ) {
        datasource = 'nvenue'
        gameId = response.data.id
      }
    } catch (err) {
      log.warn({ err, eventId }, 'failed to resolve eventId in nvenue bindings')
    }
  }

  if (!gameId || !datasource) {
    throw new HttpStatusError(404, 'Provider binding not found the event')
  }

  // create metadata
  const data: StudioConfigData = metadataService.getStudioConfigData(datasource, gameId, true)

  log.debug({  data }, 'event ui metadata')

  return { data }
}

Handler.schema = 'studio.metadata.get'
Handler.allowed = allowSignedRequest
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler
