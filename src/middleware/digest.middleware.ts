import { ServiceRequest } from "@microfleet/plugin-router"
import { FleetApp } from "../fleet-app"
import crypto from "crypto"
import { AuthenticationRequiredError, NotPermittedError } from "common-errors"

export function digestMiddleware(this: FleetApp, request: ServiceRequest) {
  const { config } = this
  const { headers } = request
  
  const digestHeader = headers[config.adapter.digestHeader]
  if (!digestHeader) {
    throw new AuthenticationRequiredError("Digest header not found")
  }

  const dataString = JSON.stringify(request.params)
  const bodyDigest = crypto.createHmac(config.adapter.digestAlgorithm, config.adapter.digestApiKey)
    .update(dataString)
    .digest('hex')

  if ( digestHeader !== bodyDigest) {
    throw new NotPermittedError("Bad digest")
  }
}
