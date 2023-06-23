import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { ItemResponse, toResponseItem } from "../../../models/dto/response"
import { TriggerWithConditions } from "../../../models/dto/trigger-with-conditions"

async function Handler(this: FleetApp, request: ServiceRequest,): Promise<ItemResponse<TriggerWithConditions>> {
  const { id } = request.params as any

  const { studioService } = this

  const trigger = await studioService.getTrigger(id)

  this.log.debug({ request: { id }, trigger }, "get trigger")

  return {
    data: toResponseItem<TriggerWithConditions>(id, 'trigger', trigger)
  } as ItemResponse<TriggerWithConditions>
}

Handler.schema = 'studio.trigger.get'
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler

