
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { EntitySetLimitsRequest } from '../../../models/dto/entity-set-limits-request'
import { allowSignedRequest } from '../../../plugins/signed-request.plugin'

async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { entity, entityId, limits } = request.params as unknown as EntitySetLimitsRequest
  const { studioService } = this

  await studioService.setEntityLimits(entity, entityId, limits)

  return {}
}

Handler.schema = 'studio.entity.set-limits'
Handler.allowed = allowSignedRequest
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler

