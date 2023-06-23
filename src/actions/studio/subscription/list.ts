import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { ListResponse, toResponseItem } from "../../../models/dto/response"
import { TriggerSubscription } from "../../../models/entities/trigger-subscription"
import { SubscriptionListRequest } from "../../../models/dto/subscription-list-request"

async function Handler(this: FleetApp, request: ServiceRequest): Promise<ListResponse<TriggerSubscription>> {
  const { triggerId, entity, entityId } = request.params as SubscriptionListRequest

  const { studioService } = this

  let list

  if ( triggerId ) {
    list = await studioService.getSubscriptionListByTrigger(triggerId)
  } else {
    list = await studioService.getSubscriptionListByEntity(entity, entityId)
  }

  const data = list.map(item => {
    return toResponseItem<TriggerSubscription>(item.id, 'subscription', item)
  })

  this.log.debug({ request: { triggerId, entity, entityId }, list, data }, "get subscription list")

  return { data } as ListResponse<TriggerSubscription>
}

Handler.schema = 'studio.subscription.list'
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler

