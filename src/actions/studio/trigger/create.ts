
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../../fleet-app"
import { TriggerCreateRequest } from "../../../models/dto/trigger-create-request"

async function CreateHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { conditions, trigger } = request.params as unknown as TriggerCreateRequest

  const { studioService } = this

  await studioService.createTrigger(trigger, conditions)

  return { ok: true }
}

CreateHandler.schema = 'trigger.create'
CreateHandler.transports = [ActionTransport.amqp]

export = CreateHandler

