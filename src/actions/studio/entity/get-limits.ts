
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { EntityGetLimitsRequest } from '../../../models/dto/entity-get-limits-request'
import { EntityGetLimitsResponse } from '../../../models/dto/entity-get-limits-response'

async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { entity, entityId } = request.params as unknown as EntityGetLimitsRequest
  const { studioService } = this

  const limits = await studioService.getEntityLimits(entity, entityId)

  return { limits } as EntityGetLimitsResponse
}

Handler.schema = 'studio.entity.get-limits'
Handler.transports = [ActionTransport.amqp]

export = Handler

