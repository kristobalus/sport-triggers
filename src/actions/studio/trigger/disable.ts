
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { Response } from '../../../models/dto/response'
import { TriggerCreateResponse } from '../../../models/dto/trigger-create-response'
import { TriggerDisableRequest } from '../../../models/dto/trigger-disable-request'

async function Handler(this: FleetApp, request: ServiceRequest): Promise<Response<TriggerCreateResponse>> {
  const { id } = request.params as unknown as TriggerDisableRequest
  const { studioService } = this

  await studioService.disableTrigger(id)

  return {} as Response
}

Handler.schema = 'studio.trigger.disable'
Handler.transports = [ActionTransport.amqp]

export = Handler

