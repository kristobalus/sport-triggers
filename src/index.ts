import { createFleetApp, FleetApp } from "./fleet-app"

/**
 *
 * required for @microfleet/core mfleet.js to resolve package
 */
export default async function load(): Promise<FleetApp> {
  return createFleetApp()
}

