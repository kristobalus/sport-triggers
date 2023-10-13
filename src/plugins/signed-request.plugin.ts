import { ConnectorsTypes } from '@microfleet/core'
import { ServiceRequest } from '@microfleet/plugin-router'

import crypto from 'crypto'

import Boom from '@hapi/boom'

import { FleetApp } from '../fleet-app'

export function allowSignedRequest(this: FleetApp, request: ServiceRequest) {
  const { config } = this
  const { headers } = request

  if ( request.transport === "http" ) {
    const token = headers[config.signedRequest.tokenHeader]

    if (!token) {
      throw Boom.unauthorized()
    }
  }
}

export function sign(algorithm: string, secret: string, data: string) {
  return crypto.createHmac(algorithm, secret)
    .update(data)
    .digest('base64')
}

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    await parent.hapi.register({
      plugin: {
        name: 'signed',
        version: '1.0.0',
        // eslint-disable-next-line require-await
        register: async function (server, _options) {
          const { config, log } = parent
          const { algorithm, tokenHeader, signatureHeader, accessTokens } = config.signedRequest

          server.ext('onRequest', (request, h) => {
            if (request.headers[tokenHeader]) {
              const token = request.headers[tokenHeader]
              const secret = accessTokens[token]

              if (!secret) {
                throw Boom.unauthorized('Bad token')
              }

              if (!request.headers[signatureHeader] ) {
                throw Boom.unauthorized('Signature required')
              }

              const hmac = crypto.createHmac(algorithm, secret)

              request.plugins['hmac'] = hmac

              // Listen to the data event
              request.raw.req.on('data', (chunk) => {
                hmac.update(chunk)
              })
            }

            return h.continue
          })

          server.ext('onPreHandler', (request, h) => {
            if ( request.plugins['hmac'] ) {
              const digest = request.plugins['hmac'].digest('base64')

              if (request.headers[tokenHeader]) {
                const signature = request.headers[signatureHeader]

                log.trace({ digest, signature }, 'authentication attempt')

                if (digest !== signature) {
                  throw Boom.unauthorized('Bad signature')
                }
              }
            }

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

