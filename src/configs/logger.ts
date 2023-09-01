import type { CoreOptions } from '@microfleet/core-types'

export const logger: Partial<CoreOptions['logger']> = {
  defaultLogger: true,
  debug: true,
  options: {
    level: 'debug'
  }
}
