
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { EntityGetLimitsRequest } from '../../../models/dto/entity-get-limits-request'
import { EntityGetLimitsResponse } from '../../../models/dto/entity-get-limits-response'
import { allowSignedRequest } from '../../../plugins/signed-request.plugin'

async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { entity, entityId } = request.params as unknown as EntityGetLimitsRequest
  const { studioService } = this

  const limits = await studioService.getEntityLimits(entity, entityId)
  const enabled = await studioService.isEntityLimitsEnabled(entity, entityId)

  return { limits, enabled } as EntityGetLimitsResponse
}

Handler.schema = 'studio.entity.get-limits'
Handler.allowed = allowSignedRequest
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler

