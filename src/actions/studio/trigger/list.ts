import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { ListResponse, toResponseItem } from "../../../models/dto/response"
import { TriggerWithConditions } from "../../../models/dto/trigger-with-conditions"

async function ListHandler(this: FleetApp, request: ServiceRequest,): Promise<ListResponse<TriggerWithConditions>> {
  const { entity, entityId } = request.params as any

  const { studioService } = this

  const list = await studioService.getTriggerList(entity, entityId, true)
  const data = list.map(item => {
    return toResponseItem<TriggerWithConditions>(item.trigger.id, 'trigger', item)
  })

  this.log.debug({ request: { entity, entityId }, list, data }, "get trigger list")

  return { data } as ListResponse<TriggerWithConditions>
}

ListHandler.schema = 'studio.trigger.list'
ListHandler.transports = [ActionTransport.amqp, ActionTransport.http]

export = ListHandler

