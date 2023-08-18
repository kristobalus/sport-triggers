import { ConnectorsTypes } from '@microfleet/core'
import { ServiceRequest } from '@microfleet/plugin-router'

import crypto from 'crypto'

// import { boomify } from '@hapi/boom'
import { HttpStatusError } from 'common-errors'

import { FleetApp } from '../fleet-app'

export function allowSignedRequest(this: FleetApp, request: ServiceRequest) {
  const { config } = this
  const { headers } = request

  const token = headers[config.signedRequest.tokenHeader]

  if (!token) {
    throw new HttpStatusError(401, 'Authentication required')
  }
}

export function sign(algorithm: string, secret: string, data: string) {
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
      throw new HttpStatusError(401, 'Authentication required')
    }

    const bodyDigest = sign(algorithm, secret, rawPayload)
    const digest = request.headers[digestHeader]

    log.trace({ secret, token, digest, bodyDigest, payload: rawPayload }, 'authentication attempt')

    if (digest !== bodyDigest) {
      throw new HttpStatusError(403, 'Bad digest')
    }
  }
}

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    await parent.hapi.register({
      plugin: {
        name: 'signed-request',
        version: '1.0.0',
        // eslint-disable-next-line require-await
        register: async function (server, _options) {
          server.ext('onRequest', (request, h) => {
            // This will store the chunks of data received
            const chunks = []

            // Listen to the data event
            request.raw.req.on('data', (chunk) => {
              chunks.push(chunk)
            })

            // Once the stream ends, we have the complete raw payload
            request.raw.req.on('end', () => {
              const rawPayload = Buffer.concat(chunks).toString('utf8')

              try {
                verify(parent, request, rawPayload)
              } catch (err) {

                const errorPayload = {
                  statusCode: 401,
                  error: 'Authentication required',
                  message: 'Authentication required'
                };

                const response = h.response(errorPayload);
                response.code(401);
                throw response;  // Throwing ensures the request lifecycle stops here.
                // throw boomify(err, { statusCode: err.status_code, message: err.message })
              }
            })

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

