import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { ItemResponse, toResponseItem } from '../../../models/dto/response'
import { TriggerWithConditions } from '../../../models/dto/trigger-with-conditions'
import { TriggerGetRequest } from '../../../models/dto/trigger-get-request'
import { allowSignedRequest } from '../../../plugins/signed-request.plugin'

async function Handler(this: FleetApp, request: ServiceRequest,): Promise<ItemResponse<TriggerWithConditions>> {
  const { id, options } = request.params as TriggerGetRequest

  const { studioService } = this

  const shouldShowLog = options?.includes('log')
  const shouldTrim = !options?.includes('notrim')
  const trigger = await studioService.getTrigger(id, { showLog: shouldShowLog, trim: shouldTrim })

  this.log.debug({ request: { id }, trigger }, 'get trigger')

  return {
    data: toResponseItem<TriggerWithConditions>(id, 'trigger', trigger)
  } as ItemResponse<TriggerWithConditions>
}

Handler.schema = 'studio.trigger.get'
Handler.allowed = allowSignedRequest
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler

