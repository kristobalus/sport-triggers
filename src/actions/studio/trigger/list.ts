import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { ListResponse, toResponseItem } from "../../../models/dto/response"
import { TriggerWithConditions } from "../../../models/dto/trigger-with-conditions"

async function Handler(this: FleetApp, request: ServiceRequest,): Promise<ListResponse<TriggerWithConditions>> {
  const { entity, entityId } = request.params as any

  const { studioService } = this

  const list = await studioService.getTriggerListByEntity(entity, entityId, { showLog: true, trim: true })
  const data = list.map(item => {
    return toResponseItem<TriggerWithConditions>(item.trigger.id, 'trigger', item)
  })

  this.log.debug({ request: { entity, entityId }, list, data }, "get trigger list")

  return { data } as ListResponse<TriggerWithConditions>
}

Handler.schema = 'studio.trigger.list'
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler

