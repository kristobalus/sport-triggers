import { ServiceRequest } from "@microfleet/plugin-router"
import { FleetApp } from "../fleet-app"
import { AuthenticationRequiredError } from "common-errors"
import crypto from "crypto"


export function signedRequestMiddleware(this: FleetApp, request: ServiceRequest) {
  const { config } = this
  const { headers } = request

  const token = headers[config.signedRequest.tokenHeader]
  if (!token) {
    throw new AuthenticationRequiredError("Bad access token")
  }
}

export function sign(algorithm:string , secret: string, data: string) {
  return crypto.createHmac(algorithm, secret)
    .update(data)
    .digest('base64')
}

