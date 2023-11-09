
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { Response } from '../../../models/dto/response'


async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { entity, entityId } = request.params as any
  const { studioService } = this

  await studioService.enableEntity(entity, entityId)

  return {} as Response
}

Handler.schema = 'studio.entity.enable'
Handler.transports = [ActionTransport.amqp]

export = Handler

