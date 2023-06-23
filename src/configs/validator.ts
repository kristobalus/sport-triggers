import type { CoreOptions } from '@microfleet/core-types'

import { resolve } from 'node:path'

export const validator: Partial<CoreOptions['validator']> = {
  schemas: [resolve(__dirname, '../../schemas')],
  ajv: {
    validateSchema: true,
    useDefaults: true,
    allowUnionTypes: true
  }
}
