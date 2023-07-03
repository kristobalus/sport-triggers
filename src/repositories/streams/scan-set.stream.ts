import { Readable, ReadableOptions } from 'stream'

import { Redis } from 'ioredis'

export interface Options extends ReadableOptions {
  redis: Redis
  key: string
}

export class ScanSetStream extends Readable {
  private readonly key: string
  private readonly redis: Redis
  private cursor: string

  constructor(options: Options) {
    options.objectMode = true
    super(options)
    this.key = options.key
    this.redis = options.redis
  }

  _read(_size: number) {
    this.scan()
      .catch(err => {
        this.emit('error', err)
        this.push(null)
      })
  }

  private async scan(): Promise<void> {
    const [cursor, items] = await this.redis.sscan(this.key, this.cursor)

    this.cursor = cursor

    if (items.length === 0) {
      this.push(null)
    } else {
      this.push(items)
    }

    if ( this.cursor === '0' || items.length == 0 ) {
      this.push(null)
    }
  }
}

