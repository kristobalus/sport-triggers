import { ServiceRequest } from "@microfleet/plugin-router"
import { FleetApp } from "../fleet-app"
import crypto from "crypto"
import { AdapterPushRequest } from "../models/dto/adapter-push-request"
import { NotPermittedError } from "common-errors"

export function digestMiddleware(this: FleetApp, request: ServiceRequest) {
  const { config } = this
  const { headers } = request
  const { event } = request.params as AdapterPushRequest

  if ( config.adapter.digestApiKey ) {
    const dataString = JSON.stringify(event)
    const digest = crypto.createHmac(config.adapter.digestAlgorithm, config.adapter.digestApiKey)
      .update(dataString)
      .digest('hex')

    if (headers[config.adapter.digestHeader] !== digest) {
      throw new NotPermittedError("Bad digest")
    }
  }
}
