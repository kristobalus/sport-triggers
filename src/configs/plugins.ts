import type { CoreOptions } from '@microfleet/core-types'

export const plugins: CoreOptions['plugins']  = [
  'logger',
  'validator',
  'amqp',
  'redisSentinel',
  'hapi',
  'router',
  'router-hapi',
  'router-amqp'
]
