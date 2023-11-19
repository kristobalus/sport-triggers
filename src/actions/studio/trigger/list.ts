import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { ArgumentError } from 'common-errors'

import { FleetApp } from '../../../fleet-app'
import { ListResponse, toResponseItem } from '../../../models/dto/response'
import { TriggerWithConditions } from '../../../models/dto/trigger-with-conditions'
import { TriggerListRequest } from '../../../models/dto/trigger-list-request'
import { allowSignedRequest } from '../../../plugins/signed-request.plugin'

async function Handler(this: FleetApp, request: ServiceRequest,): Promise<ListResponse<TriggerWithConditions>> {
  const { entity, entityId, scope, scopeId, datasource } = request.params as TriggerListRequest

  const { studioService } = this

  let list

  if (entity && entityId) {
    list = await studioService.getTriggerListByEntity(entity, entityId, { showLog: false, trim: true })
  }
  else if (datasource && scope && scopeId) {
    list = await studioService.getTriggerListByScope(datasource, scope, scopeId, { showLog: false, trim: true })
  } else {
    throw new ArgumentError('Either { entity, entityId } pair or { datasource, scope, scopeId } should be defined')
  }

  const data = list.map(item => {
    return toResponseItem<TriggerWithConditions>(item.trigger.id, 'trigger', item)
  })

  this.log.debug({ request: { entity, entityId, scope, scopeId }, list, data }, 'trigger list')

  return { data } as ListResponse<TriggerWithConditions>
}

Handler.schema = 'studio.trigger.list'
Handler.allowed = allowSignedRequest
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler

