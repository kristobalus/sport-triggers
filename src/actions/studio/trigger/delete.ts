
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { ItemResponse } from '../../../models/dto/response'
import { TriggerDeleteRequest } from '../../../models/dto/trigger-delete-request'

async function DeleteHandler(this: FleetApp, request: ServiceRequest): Promise<ItemResponse> {
  const { id } = request.params as TriggerDeleteRequest

  const { studioService } = this

  await studioService.deleteTrigger(id)

  return {
    data: {
      id,
      type: 'trigger'
    }
  } as ItemResponse
}

DeleteHandler.schema = 'studio.trigger.delete'
DeleteHandler.transports = [ActionTransport.amqp]

export = DeleteHandler

