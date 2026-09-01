import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  // ponytail: In-memory store fallback if Redis instance is not available during local development/testing
  private readonly fallbackStore = new Map<
    string,
    { value: string; expiresAt: number }
  >();

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>('redis.url');
    const host = this.config.get<string>('redis.host') || 'localhost';
    const port = this.config.get<number>('redis.port') || 6379;
    const password = this.config.get<string>('redis.password');

    try {
      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 5000,
        });
      } else {
        this.client = new Redis({
          host,
          port,
          password: password || undefined,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 5000,
        });
      }

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis client connected successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(
          `Redis connection error (${err.message}). Using in-memory fallback store.`,
        );
      });

      await this.client.connect().catch((err) => {
        this.isConnected = false;
        this.logger.warn(
          `Could not connect to Redis (${err.message}). Using in-memory fallback store.`,
        );
      });
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `Redis initialization skipped (${err.message}). Using in-memory fallback store.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err: any) {
        this.logger.warn(
          `Redis SET failed for key ${key} (${err.message}). Storing in fallback store.`,
        );
      }
    }

    // In-memory fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.fallbackStore.set(key, { value, expiresAt });
    if (ttlSeconds && ttlSeconds > 0) {
      setTimeout(() => {
        const item = this.fallbackStore.get(key);
        if (item && item.expiresAt <= Date.now()) {
          this.fallbackStore.delete(key);
        }
      }, ttlSeconds * 1000);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err: any) {
        this.logger.warn(
          `Redis GET failed for key ${key} (${err.message}). Checking fallback store.`,
        );
      }
    }

    // In-memory fallback
    const item = this.fallbackStore.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.fallbackStore.delete(key);
      return null;
    }
    return item.value;
  }

  async del(key: string): Promise<number> {
    let deletedCount = 0;
    if (this.isConnected && this.client) {
      try {
        deletedCount = await this.client.del(key);
      } catch (err: any) {
        this.logger.warn(
          `Redis DEL failed for key ${key} (${err.message}). Removing from fallback store.`,
        );
      }
    }

    if (this.fallbackStore.delete(key)) {
      deletedCount = Math.max(deletedCount, 1);
    }
    return deletedCount;
  }
}
