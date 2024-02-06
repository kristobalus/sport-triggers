import { Config as RedisConfig } from '@microfleet/plugin-redis-sentinel'
import { Microfleet } from '@microfleet/core-types'

import { Worker, Job, Queue } from 'bullmq'
import { RedisOptions } from 'ioredis'
import { uniq } from 'lodash'

import { getEventUriListBySnapshot, ScopeSnapshot } from '../../models/events/scope-snapshot'
import { AdapterService } from '../adapter/adapter.service'

export function getQueueRedisConfig(config: RedisConfig): RedisOptions {
  return {
    ...config,
    ...{ options: { keyPrefix: undefined } } as RedisConfig,
  }
}

export interface StoreJob {
  snapshot: ScopeSnapshot
}

export interface EventJob {
  snapshot: ScopeSnapshot
}

export interface TriggerJob {
  triggerId: string
  snapshot: ScopeSnapshot
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
  public storeJobCallback?: (result) => any

  private storeQueue: Queue
  private storeWorker: Worker

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

    this.storeQueue.on('error', (err) => {
      this.log.trace({ err }, 'error in store queue')
    })

    this.triggerQueue = new Queue('triggers', {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
      connection: redisOptions,
    })

    this.triggerQueue.on('error', (err) => {
      this.log.trace({ err }, 'error in trigger queue')
    })

    this.notificationQueue = new Queue('notifications', {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
      connection: redisOptions,
    })

    this.notificationQueue.on('error', (err) => {
      this.log.trace({ err }, 'error in notification queue')
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
    await this.storeQueue.add('store', { snapshot } as StoreJob)
    this.log.debug({ snapshot }, 'snapshot scheduled for storing')
  }

  /**
   * @description stores scope snapshot into persistent storage
   * @param job
   */
  async onStoreScopeSnapshotJob(job: Job<StoreJob>) {
    const { adapterService, triggerQueue } = this
    const { snapshot } = job.data

    if (await adapterService.hasTriggers(snapshot)) {
      if (await adapterService.storeScopeSnapshot(snapshot)) {
        this.log.debug({ id: job.id, snapshot }, 'at least one trigger is interested in the snapshot')
        const eventUriList = getEventUriListBySnapshot(snapshot)

        this.log.debug({ eventUriList, snapshot }, 'uri list for snapshot')

        // for( const uri of uris) {
        //   for await (const triggers of adapterService.getTriggersByUri(uri)) {
        //     if ( triggers.length ) {
        //       this.log.debug({ triggers, uri, snapshot }, 'trigger list from db')
        //
        //       const jobs = triggers.map((trigger) => ({
        //         name: 'evaluate',
        //         data: { triggerId: trigger.id, snapshot } as TriggerJob }))
        //
        //       await triggerQueue.addBulk(jobs)
        //     }
        //   }
        // }

        const triggerIds = []

        for ( const uri of eventUriList) {
          for await (const ids of adapterService.getTriggerListByUri(uri)) {
            triggerIds.push(...ids)
          }
        }

        const jobs = uniq(triggerIds).map((triggerId) => ({
          name: 'evaluate',
          data: { triggerId: triggerId, snapshot } as TriggerJob }))

        await triggerQueue.addBulk(jobs)
      } else {
        this.log.debug({ snapshot }, 'snapshot has been processed before or failed to store snapshot')
      }
    }

    this.log.debug({ snapshot }, 'store job completed')

    this.storeJobCallback?.({ result: true, job })
  }

  /**
   * @description evaluates triggers against each event snapshot
   * @param job
   */
  async onTriggerJob(job: Job<TriggerJob>) {
    const { triggerId, snapshot } = job.data

    this.log.debug({ job, snapshot }, 'trigger job started')

    const activated = await this.adapterService.evaluateTrigger(snapshot, triggerId)

    if ( activated ) {
      await this.notificationQueue.add('notify', { triggerId, reason: snapshot.id } as NotificationJob)
    }

    this.log.debug({ id: job.id, name: job.name, snapshot, triggerId, activated }, 'trigger job completed')

    this.triggerJobCallback?.({ activated, job })
  }

  /**
   * @description sends notifications about activated triggers among subscribers
   * @param job
   */
  async onNotificationJob(job: Job<NotificationJob>) {
    const { triggerId, reason } = job.data

    this.log.debug({ id: job.id, name: job.name, triggerId, reason }, 'notification job started')
    await this.adapterService.notify(triggerId, reason)

    this.log.debug({ id: job.id, name: job.name }, 'notification job completed')

    this.notificationJobCallback?.({ result: true, job })
  }

  /**
   * @description clean-up function, release resources
   */
  async close() {
    await this.storeQueue.close()
    await this.triggerQueue.close()
    await this.notificationQueue.close()
    await this.storeWorker.close()
    await this.triggerWorker.close()
    await this.notificationWorker.close()
  }
}
