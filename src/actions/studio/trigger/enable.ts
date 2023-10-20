
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { Response } from '../../../models/dto/response'
import { TriggerCreateResponse } from '../../../models/dto/trigger-create-response'
import { TriggerEnableRequest } from "../../../models/dto/trigger-enable-request"

async function Handler(this: FleetApp, request: ServiceRequest): Promise<Response<TriggerCreateResponse>> {
  const { id } = request.params as unknown as TriggerEnableRequest
  const { studioService } = this

  await studioService.enableTrigger(id)

  return {} as Response
}

Handler.schema = 'studio.trigger.enable'
Handler.transports = [ActionTransport.amqp]

export = Handler

