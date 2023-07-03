import { Config as RedisConfig } from '@microfleet/plugin-redis-sentinel'
import { Microfleet } from '@microfleet/core-types'

import { Worker, Job, Queue } from 'bullmq'
import { RedisOptions } from 'ioredis'

import { Event } from '../../models/events/event'
import { Trigger } from '../../models/entities/trigger'
import { Defer } from '../../utils/defer'

import { AdapterService } from '../adapter/adapter.service'

export function getQueueRedisConfig(config: RedisConfig) {
  return {
    ...config,
    ...{ options: { keyPrefix: undefined } } as RedisConfig,
  }
}

export interface EventJob {
  event: Event
}

export interface TriggerJob {
  trigger: Trigger
  event: Event
}

export class QueueService {
  eventQueue: Queue
  eventWorker: Worker
  triggerQueue: Queue
  triggerWorker: Worker

  constructor(
    private log: Microfleet['log'],
    private adapterService: AdapterService,
    redisOptions: RedisOptions,
  ) {
    this.triggerQueue = new Queue('triggers', {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      connection: redisOptions,
    })

    this.eventQueue = new Queue('events', {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      connection: redisOptions,
    })

    this.eventWorker = new Worker('events',
      async (job: Job) => {
        try {
          await this.onEventJob(job)
        } catch (err) {
          log.error(err)
          throw err
        }
      },
      {
        connection: redisOptions,
        concurrency: 1
      })

    this.triggerWorker = new Worker('triggers',
      async (job: Job) => {
        try {
          await this.onTriggerJob(job)
        } catch (err) {
          log.error(err)
          throw err
        }
      },
      {
        connection: redisOptions,
        concurrency: 1
      })
  }

  async addEvent(event: Event) {
    await this.eventQueue.add('add', { event })
  }

  async onEventJob(job: Job<EventJob>) {
    const { adapterService, triggerQueue } = this
    const { event } = job.data

    this.log.debug({ id: job.id }, 'event job started')

    if (await adapterService.hasTriggers(event)) {
      const defer = new Defer()

      adapterService.getTriggerStreamByEvent(event)
        .on('data', async (triggers) => {
          this.log.debug({ triggers }, 'trigger list from db')
          const jobs = triggers.map((trigger) => ({ name: 'evaluate', data: { trigger, event } }))

          await triggerQueue.addBulk(jobs)
        })
        .on('error', (err) => {
          defer.reject(err)
        })
        .on('close', () => {
          defer.resolve()
        })
      await defer.promise
    }

    /*
    TODO: this is alternative way: reading all triggers subscribed for event,
      can block redis for a long time
    const triggers = await adapterService.getTriggersByEvent(event)
    const triggers = await adapterService.getTriggers(scope, scopeId, name)
    const jobs = triggers.map((trigger: Trigger) => ({ name: "evaluate", data: { trigger, event } }))
    await triggerQueue.addBulk(jobs)
    */

    this.log.debug({ id: job.id }, 'event job completed')
  }

  async onTriggerJob(job: Job<TriggerJob>) {
    const { trigger, event } = job.data

    this.log.debug({ id: job.id, name: job.name }, 'trigger job started')
    await this.adapterService.evaluateTrigger(event, trigger)
    this.log.debug({ id: job.id, name: job.name }, 'trigger job completed')
  }

  async close() {
    await this.eventQueue.close()
    await this.triggerQueue.close()
    await this.eventWorker.close()
    await this.triggerWorker.close()
  }
}
