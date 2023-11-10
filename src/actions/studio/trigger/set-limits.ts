
import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../../fleet-app'
import { TriggerSetLimitsRequest } from '../../../models/dto/trigger-set-limits-request'

async function Handler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { triggerId, limits } = request.params as unknown as TriggerSetLimitsRequest

  const { studioService } = this

  await studioService.setTriggerLimits(triggerId, limits)

  return {}
}

Handler.schema = 'studio.trigger.set-limits'
Handler.transports = [ActionTransport.amqp]

export = Handler

