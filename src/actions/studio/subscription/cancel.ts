
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { ItemResponse } from '../../../models/dto/response'
import { SubscriptionCancelRequest } from '../../../models/dto/subscription-cancel-request'

async function Handler(this: FleetApp, request: ServiceRequest): Promise<ItemResponse> {
  const { id } = request.params as SubscriptionCancelRequest

  const { studioService } = this

  await studioService.cancelSubscription(id)

  this.log.debug({ id }, 'cancel subscription')

  return {
    data: {
      id,
      type: 'subscription'
    }
  } as ItemResponse
}

Handler.schema = 'studio.subscription.cancel'
Handler.transports = [ActionTransport.amqp]

export = Handler

