import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { AuthenticationRequiredError, NotPermittedError } from "common-errors"
import crypto from "crypto"
import { ServiceRequest } from "@microfleet/plugin-router"

export function isSignedRequest(this: FleetApp, request: ServiceRequest) {
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

function verify(parent: FleetApp, request, rawPayload) {
  const { log, config  } = parent
  const { tokenHeader, digestHeader, algorithm, accessTokens } = config.signedRequest

    if (request.headers[tokenHeader]) {
      const token = request.headers[tokenHeader]
      const secret = accessTokens[token]
      if (!secret) {
        throw new NotPermittedError("Bad access token")
      }

      const bodyDigest = sign(algorithm, secret, rawPayload)
      const digest = request.headers[digestHeader]

      log.trace({ secret, token, digest, bodyDigest, payload: rawPayload }, "authentication attempt")

      if (digest !== bodyDigest) {
        throw new NotPermittedError("Bad digest")
      }
    }
}

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    parent.hapi.register({
      plugin: {
        name: 'signed-request',
        version: '1.0.0',
        register: async function (server, _options) {
          server.ext('onRequest', (request, h) => {

            // This will store the chunks of data received
            const chunks = [];

            // Listen to the data event
            request.raw.req.on('data', (chunk) => {
              chunks.push(chunk);
            });

            // Once the stream ends, we have the complete raw payload
            request.raw.req.on('end', () => {
              const rawPayload = Buffer.concat(chunks).toString('utf8');
              verify(parent, request, rawPayload)
            });

            return h.continue
          })
        },
      },
    })
  })

  // eslint-disable-next-line require-await
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  parent.addDestructor(ConnectorsTypes.application, async () => {

  })
}

