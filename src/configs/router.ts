import type { CoreOptions } from '@microfleet/core'
import { Extensions } from '@microfleet/plugin-router'

import { resolve } from 'node:path'

export const router: CoreOptions['router'] = {
  routes: {
    directory: resolve(__dirname, '../actions'),
    prefix: '',
    enabledGenericActions: ['health'],
  },
  extensions: { register: [Extensions.auditLog()] },
}
