import { Logger } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({ mockedClient: true }),
}));

import { createClient } from '@supabase/supabase-js';

describe('SupabaseService', () => {
  const logger = { log: jest.fn(), warn: jest.fn() };
  const createClientMock = createClient as jest.Mock;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(logger.log);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(logger.warn);
    logger.log.mockClear();
    logger.warn.mockClear();
    createClientMock.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildService = (configMap: Record<string, any>) => {
    const config = {
      get: jest.fn((key: string) => configMap[key]),
    };
    return new SupabaseService(config as any);
  };

  describe('constructor / initClients', () => {
    it('should create both clients when config is valid', () => {
      const service = buildService({
        'supabase.url': 'https://x.supabase.co',
        'supabase.anonKey': 'anon-key',
        'supabase.serviceRoleKey': 'svc-key',
      });

      expect(createClientMock).toHaveBeenCalledTimes(2);
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Anon'),
      );
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Service Role'),
      );
      expect(service).toBeInstanceOf(SupabaseService);
    });

    it('should warn when keys contain placeholder', () => {
      buildService({
        'supabase.url': 'https://x.supabase.co',
        'supabase.anonKey': 'your-supabase-anon-key',
        'supabase.serviceRoleKey': 'your-supabase-service-role-key',
      });

      expect(createClientMock).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('getClient', () => {
    it('should return created client when available', () => {
      const service = buildService({
        'supabase.url': 'https://x.supabase.co',
        'supabase.anonKey': 'anon-key',
        'supabase.serviceRoleKey': 'svc-key',
      });

      const client = service.getClient();
      expect(client).toEqual({ mockedClient: true });
    });

    it('should lazily create client with placeholder fallback', () => {
      const service = buildService({});

      service.getClient();

      expect(createClientMock).toHaveBeenCalledWith(
        'https://placeholder.supabase.co',
        'placeholder-anon-key',
        expect.any(Object),
      );
    });
  });

  describe('getAdminClient', () => {
    it('should return created admin client when available', () => {
      const service = buildService({
        'supabase.url': 'https://x.supabase.co',
        'supabase.anonKey': 'anon-key',
        'supabase.serviceRoleKey': 'svc-key',
      });

      const client = service.getAdminClient();
      expect(client).toEqual({ mockedClient: true });
    });

    it('should lazily create admin client with placeholder fallback', () => {
      const service = buildService({});

      service.getAdminClient();

      expect(createClientMock).toHaveBeenCalledWith(
        'https://placeholder.supabase.co',
        'placeholder-service-key',
        expect.any(Object),
      );
    });
  });
});