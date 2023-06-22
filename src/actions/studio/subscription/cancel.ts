
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { ItemResponse } from "../../../models/dto/response"

async function Handler(this: FleetApp, request: ServiceRequest): Promise<ItemResponse> {
  const { id } = request.params as any

  const { studioService } = this
  await studioService.cancelSubscription(id)

  this.log.debug({ id }, "cancel subscription")

  return {
    data: {
      id,
      type: "subscription.cancelled"
    }
  } as ItemResponse
}

Handler.schema = 'studio.subscription.cancel'
Handler.transports = [ActionTransport.amqp]

export = Handler

