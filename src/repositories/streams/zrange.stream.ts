import { Readable, ReadableOptions } from 'stream'

import { Redis } from 'ioredis'

export interface Options extends ReadableOptions {
  redis: Redis
  key: string
  limit?: number
}

export class ZRangeStream extends Readable {
  private readonly key: string
  private readonly redis: Redis
  private readonly limit: number
  private start: number
  private stop: number

  constructor(options: Options) {
    options.objectMode = true
    super(options)
    this.key = options.key
    this.redis = options.redis
    this.start = 0
    this.limit = options.limit ?? 100
    this.setStop()
  }

  _read(_size: number) {
    this.fetch()
      .catch(err => {
        this.emit('error', err)
        this.push(null)
      })
  }

  private async fetch(): Promise<void> {
    const items = await this.redis.zrange(this.key, this.start, this.stop)
    if (items.length === 0) {
      this.push(null)
    } else {
      this.start = this.stop + 1
      this.setStop()
      this.push(items)
    }
  }

  private setStop() {
    this.stop = this.start + this.limit - 1
  }

}

