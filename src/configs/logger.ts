import type { CoreOptions } from '@microfleet/core-types'

import { pino } from "pino"

export const logger: Partial<CoreOptions['logger']> = {
  defaultLogger: true,
  debug: true,
  options: {
    level: "info"
  } as pino.LoggerOptions
}
