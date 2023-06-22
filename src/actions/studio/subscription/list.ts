import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { ListResponse, toResponseItem } from "../../../models/dto/response"
import { TriggerSubscription } from "../../../models/entities/trigger-subscription"
import { SubListRequest } from "../../../models/dto/sub-list-request"

async function ListHandler(this: FleetApp, request: ServiceRequest): Promise<ListResponse<TriggerSubscription>> {
  const { triggerId, entity, entityId } = request.params as SubListRequest

  const { studioService } = this

  let list
  if ( triggerId ) {
    list = await studioService.getSubListByTrigger(triggerId)
  } else {
    list = await studioService.getSubListByEntity(entity, entityId)
  }

  const data = list.map(item => {
    return toResponseItem<TriggerSubscription>(item.id, 'subscription', item)
  })

  this.log.debug({ request: { triggerId, entity, entityId }, list, data }, "get subscription list")

  return { data } as ListResponse<TriggerSubscription>
}

ListHandler.schema = 'studio.subscription.list'
ListHandler.transports = [ActionTransport.amqp, ActionTransport.http]

export = ListHandler

