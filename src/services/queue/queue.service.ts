import { Config as RedisConfig } from '@microfleet/plugin-redis-sentinel'
import { Microfleet } from '@microfleet/core-types'

import { Worker, Job, Queue } from 'bullmq'
import { RedisOptions } from 'ioredis'

import { AdapterEvent } from '../../models/events/adapter-event'
import { AdapterService } from '../adapter/adapter.service'
import { Event } from '../../models/events/event'

export function getQueueRedisConfig(config: RedisConfig): RedisOptions {
  return {
    ...config,
    ...{ options: { keyPrefix: undefined } } as RedisConfig,
  }
}

export interface StoreJob {
  adapterEvent: AdapterEvent
}

export interface EventJob {
  event: Event
}

export interface TriggerJob {
  triggerId: string
  event: Event
}

export interface NotificationJob {
  triggerId: string
}

export class QueueService {
  public notificationJobCallback?: (result) => any
  public triggerJobCallback?: (result) => any
  public eventJobCallback?: (result) => any

  private storeQueue: Queue
  private storeWorker: Worker

  private eventQueue: Queue
  private eventWorker: Worker

  private triggerQueue: Queue
  private triggerWorker: Worker

  private notificationQueue: Queue
  private notificationWorker: Worker

  constructor(
    private log: Microfleet['log'],
    private adapterService: AdapterService,
    redisOptions: RedisOptions
  ) {
    this.storeQueue = new Queue('store', {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
      connection: redisOptions,
    })

    this.triggerQueue = new Queue('triggers', {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
      connection: redisOptions,
    })

    this.eventQueue = new Queue('events', {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
      connection: redisOptions,
    })

    this.notificationQueue = new Queue('notifications', {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
      connection: redisOptions,
    })

    this.storeWorker = new Worker('store',
      async (job: Job) => {
        try {
          await this.onStoreJob(job)
        } catch (err) {
          log.error(err)
          throw err
        }
      },
      {
        connection: redisOptions,
        concurrency: 1
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

    this.notificationWorker = new Worker('notifications',
      async (job: Job) => {
        try {
          await this.onNotificationJob(job)
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

  async addAdapterEvent(event: AdapterEvent) {
    await this.storeQueue.add('store', { adapterEvent: event } as StoreJob)
  }

  async onStoreJob(job: Job<StoreJob>) {
    const { adapterEvent } = job.data
    const { adapterService } = this

    const jobs = []

    for (const [name, value] of Object.entries(adapterEvent.options)) {
      const event = { ...adapterEvent, name, value } as Event

      if (await adapterService.hasTriggers(event)) {
        jobs.push({ name: 'evaluate', data: { event } as EventJob })
      }
    }

    if (jobs.length > 0) {
      // store adapter event in game log
      await this.adapterService.store(adapterEvent)
      await this.eventQueue.addBulk(jobs)
      this.log.debug({ count: jobs.length  }, 'event jobs scheduled')
    }

    this.log.debug({ adapterEvent }, 'store job completed')
  }

  async onEventJob(job: Job<EventJob>) {
    const { adapterService, triggerQueue } = this
    const { event } = job.data

    this.log.debug({ id: job.id }, 'there is definitely a trigger interested in the event, event job started')

    // trigger processing
    if (await adapterService.hasTriggers(event)) {
      for await (const triggers of adapterService.getTriggers(event)) {
        this.log.debug({ triggers }, 'trigger list from db')
        const jobs = triggers.map((trigger) => ({
          name: 'evaluate',
          data: { triggerId: trigger.id, event } as TriggerJob }))

        await triggerQueue.addBulk(jobs)
      }
    }

    this.log.debug({ id: job.id }, 'event job completed')

    this.eventJobCallback?.({ result: true, job })
  }

  async onTriggerJob(job: Job<TriggerJob>) {
    const { triggerId, event } = job.data

    this.log.debug({ id: job.id, name: job.name, triggerId, event }, 'trigger job started')
    const result = await this.adapterService.evaluateTrigger(event, triggerId)

    if ( result ) {
      await this.notificationQueue.add('notify', { triggerId } as NotificationJob)
    }

    this.log.debug({ id: job.id, name: job.name, result }, 'trigger job completed')

    this.triggerJobCallback?.({ result, job })
  }

  async onNotificationJob(job: Job<NotificationJob>) {
    const { triggerId } = job.data

    this.log.debug({ id: job.id, name: job.name, triggerId }, 'notification job started')
    await this.adapterService.notify(triggerId)

    this.log.debug({ id: job.id, name: job.name }, 'notification job completed')

    this.notificationJobCallback?.({ result: true, job })
  }

  async close() {
    await this.storeQueue.close()
    await this.eventQueue.close()
    await this.triggerQueue.close()
    await this.notificationQueue.close()
    await this.storeWorker.close()
    await this.eventWorker.close()
    await this.triggerWorker.close()
    await this.notificationWorker.close()
  }
}
