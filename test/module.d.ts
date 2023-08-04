
import { GotInstance } from 'got'

import { FleetApp } from '../src/fleet-app'

interface TestContext {
  app?: FleetApp
  request?: GotInstance
  sandbox?: import('sinon').SinonSandbox
  stubs?: {
    [k: string]: import('sinon').SinonStub | import('sinon').SinonSpy
  }
}
