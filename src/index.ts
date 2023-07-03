import { createFleetApp, FleetApp } from './fleet-app'

/**
 *
 * required by @microfleet/core mfleet.js to resolve package
 */
// eslint-disable-next-line import/no-default-export
// eslint-disable-next-line require-await
export default async function(): Promise<FleetApp> {
  return createFleetApp()
}

