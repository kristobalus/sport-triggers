import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"

import { FleetApp } from "../../fleet-app"
import { EventMetadata, metadata } from "../../models/event-metadata"
import { Response } from "../../models/dto/response"

async function Handler(this: FleetApp, _request: ServiceRequest,): Promise<Response<Record<string, EventMetadata>>> {
  const data = metadata
  return { data } as Response<Record<string, EventMetadata>>
}

Handler.schema = 'studio.metadata'
Handler.transports = [ActionTransport.amqp, ActionTransport.http]

export = Handler
