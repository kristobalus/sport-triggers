
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { ItemResponse } from "../../../models/dto/response"
import { Trigger } from "../../../models/entities/trigger"

async function DeleteHandler(this: FleetApp, request: ServiceRequest): Promise<ItemResponse<Partial<Trigger>>> {
  const { id } = request.params as any

  const { studioService } = this

  await studioService.deleteTrigger(id)

  return {
    data: {
      id,
      type: "trigger"
    }
  } as ItemResponse<Partial<Trigger>>
}

DeleteHandler.schema = 'studio.trigger.delete'
DeleteHandler.transports = [ActionTransport.amqp]

export = DeleteHandler

