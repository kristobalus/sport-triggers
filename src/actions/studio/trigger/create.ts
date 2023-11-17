
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { TriggerCreateRequest } from '../../../models/dto/trigger-create-request'
import { ItemResponse, Response } from '../../../models/dto/response'
import { TriggerCreateResponse } from '../../../models/dto/trigger-create-response'

async function CreateHandler(this: FleetApp, request: ServiceRequest): Promise<Response<TriggerCreateResponse>> {
  const { conditions, trigger, limits } = request.params as unknown as TriggerCreateRequest

  const { studioService, metadataService, log } = this

  const { datasource, scopeId } = trigger
  const source = metadataService.getDatasource(datasource)
  const game = source.getGame(scopeId)

  if (!game) {
    log.debug({ game, scopeId, datasource }, 'game not found')
  }

  trigger.sport = game.sport

  const id = await studioService.createTrigger(trigger, conditions, limits)

  return {
    data: {
      id: id,
      type: 'trigger'
    }
  } as ItemResponse
}

CreateHandler.schema = 'studio.trigger.create'
CreateHandler.transports = [ActionTransport.amqp]

export = CreateHandler

