import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let configService: any;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'redis.url') return '';
        if (key === 'redis.host') return 'localhost';
        if (key === 'redis.port') return 6379;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should store, retrieve, and delete values from fallback in-memory store if redis not connected', async () => {
    await service.set('test-key', 'test-value', 60);

    const retrieved = await service.get('test-key');
    expect(retrieved).toBe('test-value');

    const delCount = await service.del('test-key');
    expect(delCount).toBe(1);

    const afterDel = await service.get('test-key');
    expect(afterDel).toBeNull();
  });

  it('should return null for non-existent or expired keys in fallback store', async () => {
    const val = await service.get('non-existent');
    expect(val).toBeNull();
  });
});
