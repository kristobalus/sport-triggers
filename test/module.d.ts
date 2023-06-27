
import { GotInstance } from 'got'

interface TestContext {
  service?: import('@microfleet/core').Microfleet
  request?: GotInstance
  sandbox?: import('sinon').SinonSandbox
  stubs?: {
    [k: string]: import('sinon').SinonStub | import('sinon').SinonSpy
  }
}
