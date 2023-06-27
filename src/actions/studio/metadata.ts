import { ActionTransport, ServiceRequest } from '@microfleet/plugin-router'

import { FleetApp } from '../../fleet-app'

function Handler(this: FleetApp, _request: ServiceRequest) {
  const data = this.studioService.getMetadata()

  return { data }
}

Handler.schema = 'studio.metadata'
Handler.transports = [ActionTransport.amqp]

export = Handler
