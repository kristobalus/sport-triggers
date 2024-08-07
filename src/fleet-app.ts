import { Microfleet } from '@microfleet/core'
import { CoreOptions } from '@microfleet/core-types'
import '@microfleet/plugin-validator'
import '@microfleet/plugin-logger'
import '@microfleet/plugin-router'
import '@microfleet/plugin-amqp'
import '@microfleet/plugin-hapi'
import '@microfleet/plugin-router-amqp'
import '@microfleet/plugin-router-hapi'
import '@microfleet/plugin-redis-sentinel'

import { resolve } from 'node:path'
import { strict as assert } from 'node:assert'

import { Store } from 'ms-conf'

import { AdapterService } from './services/adapter/adapter.service'
import { StudioService } from './services/studio/studio.service'
import { init as initAdapterService } from './plugins/adapter-service.plugin'
import { init as initStudioService } from './plugins/studio-service.plugin'
import { init as initMetadataService } from './plugins/metadata-service.plugin'
import { init as initSignedRequest } from './plugins/signed-request.plugin'
import { QueueService } from './services/queue/queue.service'
import { MetadataService } from './services/studio/metadata.service'

export class FleetApp extends Microfleet {
  public adapterService: AdapterService
  public studioService: StudioService
  public queueService: QueueService
  public metadataService: MetadataService

  constructor(options: Partial<CoreOptions>) {
    super(options)

    initAdapterService(this)
    initStudioService(this)
    initMetadataService(this)
    initSignedRequest(this)
  }
}

export async function loadConfiguration() {
  assert(process.env.NCONF_NAMESPACE, 'should have env NCONF_NAMESPACE defined')

  const store = new Store({ defaultOpts: { env: process.env.NODE_ENV } })
  const path = resolve(__dirname, './configs')

  store.prependDefaultConfiguration(path)
  await store.ready()

  return store.get<CoreOptions>('/', { env: process.env.NODE_ENV })
}

export async function createFleetApp(options?: Partial<CoreOptions>): Promise<FleetApp> {
  const config = await loadConfiguration()

  options = {
    ...config,
    ...options ?? {}
  }

  return new FleetApp(options)
}
