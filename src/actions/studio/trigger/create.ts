
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { TriggerCreateRequest } from "../../../models/dto/trigger-create-request"
import { Response, ResponseItem } from "../../../models/dto/response"
import { TriggerCreateResponse } from "../../../models/dto/trigger-create-response"


async function CreateHandler(this: FleetApp, request: ServiceRequest): Promise<Response<TriggerCreateResponse>> {
  const { conditions, trigger } = request.params as unknown as TriggerCreateRequest

  const { studioService } = this

  const id = await studioService.createTrigger(trigger, conditions)

  return {
    data: {
      id: id,
      type: "trigger",
      attributes: {
        id: id
      }
    } as ResponseItem<TriggerCreateResponse>
  } as Response<TriggerCreateResponse>
}

CreateHandler.schema = 'studio.trigger.create'
CreateHandler.transports = [ActionTransport.amqp]

export = CreateHandler

