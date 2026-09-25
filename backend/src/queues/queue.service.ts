import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface SyncJobData {
  userId: string;
  emailAccountId: string;
  provider: 'GMAIL' | 'OUTLOOK';
}

export type JobHandler = (data: SyncJobData) => Promise<void>;

export class QueueService {
  private static redisClient: IORedis | null = null;
  private static syncQueue: Queue | null = null;
  private static worker: Worker | null = null;
  private static isRedisAvailable = false;
  private static inMemoryQueue: SyncJobData[] = [];
  private static registeredHandler: JobHandler | null = null;

  public static async init(handler: JobHandler) {
    this.registeredHandler = handler;

    try {
      this.redisClient = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        retryStrategy: () => null, // Don't hang if local redis is off
      });

      this.redisClient.on('error', () => {
        if (this.isRedisAvailable) {
          logger.warn('Redis disconnected, falling back to in-memory queue runner');
          this.isRedisAvailable = false;
        }
      });

      this.redisClient.on('connect', () => {
        logger.info('Connected to Redis for background job queue');
        this.isRedisAvailable = true;
      });

      // Give 500ms to check connection
      await new Promise((r) => setTimeout(r, 300));

      if (this.redisClient.status === 'ready' || this.redisClient.status === 'connect') {
        this.isRedisAvailable = true;
        this.syncQueue = new Queue('email-sync-queue', { connection: this.redisClient });
        this.worker = new Worker(
          'email-sync-queue',
          async (job: Job<SyncJobData>) => {
            logger.info(`Processing BullMQ sync job ${job.id} for user ${job.data.userId}`);
            await handler(job.data);
          },
          { connection: this.redisClient }
        );
      } else {
        logger.info('Redis not detected locally. Initialized in-memory resilient background queue.');
      }
    } catch {
      logger.info('Running in resilient in-memory background queue mode');
    }
  }

  public static async dispatchSync(data: SyncJobData): Promise<void> {
    if (this.isRedisAvailable && this.syncQueue) {
      await this.syncQueue.add('sync-email', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      });
      logger.info(`Dispatched sync job to BullMQ for ${data.provider} account ${data.emailAccountId}`);
    } else {
      // Async in-memory processing
      logger.info(`Dispatched sync job to in-memory queue for ${data.provider} account ${data.emailAccountId}`);
      setImmediate(async () => {
        if (this.registeredHandler) {
          try {
            await this.registeredHandler(data);
          } catch (err) {
            logger.error(`Error processing in-memory sync job for ${data.emailAccountId}`, err);
          }
        }
      });
    }
  }
}
