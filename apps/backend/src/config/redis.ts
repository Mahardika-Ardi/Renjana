/**
 * Redis configuration and client setup for BullMQ integration
 * 
 * This module provides the Redis connection configuration used by BullMQ queues.
 * It uses the existing RedisService from the infrastructure layer.
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '../infrastructure/redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Redis configuration is handled by the existing RedisService
    // BullMQ will use the Redis instance configured in RedisModule
    console.log('🔴 RedisConfigService initialized - BullMQ can use existing Redis instance');
  }

  async onModuleDestroy() {
    // Cleanup if needed
  }

  /**
   * Get Redis connection configuration for BullMQ
   */
  getBullMQConfig() {
    return {
      host: this.configService.get<string>('redis.host') || 'localhost',
      port: parseInt(this.configService.get<string>('redis.port') || '6379'),
      password: this.configService.get<string>('redis.password'),
    };
  }
}