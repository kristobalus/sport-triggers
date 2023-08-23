
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { Response } from '../../../models/dto/response'
import { TriggerCreateResponse } from '../../../models/dto/trigger-create-response'
import { TriggerUpdateRequest } from "../../../models/dto/trigger-update-request"

async function Handler(this: FleetApp, request: ServiceRequest): Promise<Response<TriggerCreateResponse>> {
  const { updates } = request.params as unknown as TriggerUpdateRequest

  const { studioService } = this

  for(const update of updates){
    const { trigger, conditions } = update
    await studioService.updateTrigger(trigger, conditions)
  }

  return {} as Response
}

Handler.schema = 'studio.trigger.update'
Handler.transports = [ActionTransport.amqp]

export = Handler

