import { Config as RedisConfig } from '@microfleet/plugin-redis-sentinel'
import { Microfleet } from '@microfleet/core-types'

import { Worker, Job, Queue } from 'bullmq'
import { RedisOptions } from 'ioredis'

import { AdapterEvent } from '../../models/events/adapter-event'
import { Trigger } from '../../models/entities/trigger'

import { AdapterService } from '../adapter/adapter.service'
import { Event } from "../../models/events/event"

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

export interface NotificationJob {
  trigger: Trigger
}

export class QueueService {

  eventQueue: Queue
  eventWorker: Worker

  triggerQueue: Queue
  triggerWorker: Worker

  notificationQueue: Queue
  notificationWorker: Worker

  constructor(
    private log: Microfleet['log'],
    private adapterService: AdapterService,
    redisOptions: RedisOptions,
    public debugCallback?: (result) => any
  ) {
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

  async addEvent(adapterEvent: AdapterEvent) {
    const jobs = []

    for(const [name, value] of Object.entries(adapterEvent.options)) {
      const event = { ...adapterEvent, name, value }
      jobs.push({ name: 'evaluate', data: { event } })
    }

    await this.eventQueue.addBulk(jobs)
  }

  async onEventJob(job: Job<EventJob>) {
    const { adapterService, triggerQueue } = this
    const { event } = job.data

    this.log.debug({ id: job.id }, 'event job started')

    if (await adapterService.hasTriggers(event)) {
      for await (let triggers of adapterService.getTriggers(event)) {
        this.log.debug({ triggers }, 'trigger list from db')
        const jobs = triggers.map((trigger) => ({ name: 'evaluate', data: { trigger, event } }))
        await triggerQueue.addBulk(jobs)
      }
    }

    this.log.debug({ id: job.id }, 'event job completed')
  }

  async onTriggerJob(job: Job<TriggerJob>) {
    const { trigger, event } = job.data

    this.log.debug({ id: job.id, name: job.name, trigger }, 'trigger job started')
    const result = await this.adapterService.evaluateTrigger(event, trigger)
    if ( result ) {
      await this.notificationQueue.add('notify', { trigger } as NotificationJob)
    }

    this.debugCallback?.(result)
    this.log.debug({ id: job.id, name: job.name, result }, 'trigger job completed')
  }

  async onNotificationJob(job: Job<NotificationJob>) {
    const { trigger } = job.data

    this.log.debug({ id: job.id, name: job.name, trigger }, 'notification job started')
    await this.adapterService.notify(trigger)

    this.debugCallback?.(true)
    this.log.debug({ id: job.id, name: job.name }, 'notification job completed')
  }

  async close() {
    await this.eventQueue.close()
    await this.triggerQueue.close()
    await this.notificationQueue.close()
    await this.eventWorker.close()
    await this.triggerWorker.close()
    await this.notificationWorker.close()
  }
}