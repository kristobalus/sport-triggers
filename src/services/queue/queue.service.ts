import { Config as RedisConfig } from '@microfleet/plugin-redis-sentinel'
import { Microfleet } from '@microfleet/core-types'

import { Worker, Job, Queue } from 'bullmq'
import { RedisOptions } from 'ioredis'

import { ScopeSnapshot } from '../../models/events/scope-snapshot'
import { AdapterService } from '../adapter/adapter.service'
import { EventSnapshot } from '../../models/events/event-snapshot'

export function getQueueRedisConfig(config: RedisConfig): RedisOptions {
  return {
    ...config,
    ...{ options: { keyPrefix: undefined } } as RedisConfig,
  }
}

export interface StoreJob {
  scopeSnapshot: ScopeSnapshot
}

export interface EventJob {
  eventSnapshot: EventSnapshot
}

export interface TriggerJob {
  triggerId: string
  eventSnapshot: EventSnapshot
}

export interface NotificationJob {
  triggerId: string
  reason: string
}

export interface TriggerJobResult {
  activated: boolean
  job: Job<TriggerJob>
}

/**
 * @description BullMQ client
 */
export class QueueService {
  /**
   * @description this sole purpose of  this callback is serving results for tests
   */
  public notificationJobCallback?: (result) => any

  /**
   * @description this sole purpose of  this callback is serving results for tests
   */
  public triggerJobCallback?: (result: TriggerJobResult) => any

  /**
   * @description this sole purpose of  this callback is serving results for tests
   */
  public eventSnapshotJobCallback?: (result) => any

  /**
   * @description this sole purpose of  this callback is serving results for tests
   */
  public storeJobCallback?: (result) => any

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
          await this.onStoreScopeSnapshotJob(job)
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
          await this.onEventSnapshotJob(job)
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

  async addScopeSnapshot(snapshot: ScopeSnapshot) {
    await this.storeQueue.add('store', { scopeSnapshot: snapshot } as StoreJob)
    this.log.debug({ snapshot }, 'snapshot scheduled for storing')
  }

  /**
   * @description stores scope snapshot into persistent storage
   * @param job
   */
  async onStoreScopeSnapshotJob(job: Job<StoreJob>) {
    const { scopeSnapshot } = job.data
    const { adapterService } = this

    const jobs = []

    for (const [name, value] of Object.entries(scopeSnapshot.options)) {
      const event = { ...scopeSnapshot, name, value } as EventSnapshot

      if (await adapterService.hasTriggers(event)) {
        jobs.push({ name: 'evaluate', data: { eventSnapshot: event } as EventJob })
      }
    }

    if (jobs.length > 0) {
      // store adapter event in game log
      await this.adapterService.storeScopeSnapshot(scopeSnapshot)
      await this.eventQueue.addBulk(jobs)
      this.log.debug({ count: jobs.length  }, 'event jobs scheduled')
    }

    this.log.debug({ scopeSnapshot: scopeSnapshot }, 'store job completed')

    this.storeJobCallback?.({ result: true, job })
  }

  /**
   * @description generates a set of event snapshots out of scope snapshot
   * @param job
   */
  async onEventSnapshotJob(job: Job<EventJob>) {
    const { adapterService, triggerQueue } = this
    const { eventSnapshot } = job.data

    this.log.debug({ id: job.id }, 'there is definitely a trigger interested in the event, event job started')

    // trigger processing
    if (await adapterService.hasTriggers(eventSnapshot)) {
      for await (const triggers of adapterService.getTriggersBySnapshot(eventSnapshot)) {
        this.log.debug({ triggers }, 'trigger list from db')
        const jobs = triggers.map((trigger) => ({
          name: 'evaluate',
          data: { triggerId: trigger.id, eventSnapshot } as TriggerJob }))

        await triggerQueue.addBulk(jobs)
      }
    }

    this.log.debug({ id: job.id }, 'event snapshot generation job completed')

    this.eventSnapshotJobCallback?.({ result: true, job })
  }

  /**
   * @description evaluates triggers against each event snapshot
   * @param job
   */
  async onTriggerJob(job: Job<TriggerJob>) {
    const { triggerId, eventSnapshot } = job.data

    this.log.debug({ id: job.id, name: job.name, triggerId, eventSnapshot }, 'trigger job started')

    const activated = await this.adapterService.evaluateTrigger(eventSnapshot, triggerId)

    if ( activated ) {
      await this.notificationQueue.add('notify', { triggerId, reason: job.id } as NotificationJob)
    }

    this.log.debug({ id: job.id, name: job.name, triggerActivated: activated }, 'trigger job completed')

    this.triggerJobCallback?.({ activated, job })
  }

  /**
   * @description sends notifications about activated triggers among subscribers
   * @param job
   */
  async onNotificationJob(job: Job<NotificationJob>) {
    const { triggerId, reason } = job.data

    this.log.debug({ id: job.id, name: job.name, triggerId }, 'notification job started')
    await this.adapterService.notify(triggerId, reason)

    this.log.debug({ id: job.id, name: job.name }, 'notification job completed')

    this.notificationJobCallback?.({ result: true, job })
  }

  /**
   * @description clean-up function, release resources
   */
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
