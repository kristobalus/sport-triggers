

import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../fleet-app"

async function ListTriggerHandler(this: FleetApp, request: ServiceRequest): Promise<any> {
  const { data } = request.params as any

  const { studioService  } = this
  await studioService.getTriggerList(data)

  return { ok: true }
}

ListTriggerHandler.schema = 'studio.trigger.list'
ListTriggerHandler.transports = [ActionTransport.amqp, ActionTransport.http]

export = ListTriggerHandler

