
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { TriggerSubRequest } from "../../../models/dto/trigger-sub-request"
import { ItemResponse } from "../../../models/dto/response"

async function Handler(this: FleetApp, request: ServiceRequest): Promise<ItemResponse> {
  const { triggerId, subscription } = request.params as TriggerSubRequest

  const { studioService } = this
  const id = await studioService.subscribeTrigger(triggerId, subscription)

  this.log.debug({ request: {  triggerId, subscription }, id }, "subscribe for trigger")

  return {
    data: {
      id,
      type: "subscription"
    }
  } as ItemResponse
}

Handler.schema = 'studio.trigger.subscribe'
Handler.transports = [ActionTransport.amqp]

export = Handler

