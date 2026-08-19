import { appConfig, jwtConfig, supabaseConfig, openaiConfig, mailConfig, throttleConfig } from './app.config';

describe('app.config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  describe('appConfig', () => {
    it('should use env values when set', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '4000';
      process.env.APP_URL = 'https://api.example.com';
      process.env.FRONTEND_URL = 'https://example.com';

      const config = appConfig() as any;
      expect(config.nodeEnv).toBe('production');
      expect(config.port).toBe(4000);
      expect(config.appUrl).toBe('https://api.example.com');
      expect(config.frontendUrl).toBe('https://example.com');
    });

    it('should use defaults when env missing', () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.APP_URL;
      delete process.env.FRONTEND_URL;

      const config = appConfig() as any;
      expect(config.nodeEnv).toBe('development');
      expect(config.port).toBe(3001);
      expect(config.appUrl).toBe('http://localhost:3001');
      expect(config.frontendUrl).toBe('http://localhost:3000');
    });
  });

  describe('jwtConfig', () => {
    it('should use env values when set', () => {
      process.env.JWT_SECRET = 'env-secret';
      process.env.JWT_REFRESH_SECRET = 'env-refresh';
      process.env.JWT_EXPIRES_IN = '30m';
      process.env.JWT_REFRESH_EXPIRES_IN = '14d';

      const config = jwtConfig() as any;
      expect(config.secret).toBe('env-secret');
      expect(config.refreshSecret).toBe('env-refresh');
      expect(config.expiresIn).toBe('30m');
      expect(config.refreshExpiresIn).toBe('14d');
    });

    it('should use fallback secrets when env missing', () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      const config = jwtConfig() as any;
      expect(config.secret).toBe('fallback-secret-change-in-production');
      expect(config.refreshSecret).toBe('fallback-refresh-secret-change-in-production');
      expect(config.expiresIn).toBe('15m');
      expect(config.refreshExpiresIn).toBe('7d');
    });
  });

  describe('supabaseConfig', () => {
    it('should use env values when set', () => {
      process.env.SUPABASE_URL = 'https://x.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';

      const config = supabaseConfig() as any;
      expect(config.url).toBe('https://x.supabase.co');
      expect(config.anonKey).toBe('anon');
      expect(config.serviceRoleKey).toBe('service');
    });

    it('should default to empty strings', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const config = supabaseConfig() as any;
      expect(config.url).toBe('');
      expect(config.anonKey).toBe('');
      expect(config.serviceRoleKey).toBe('');
    });
  });

  describe('openaiConfig', () => {
    it('should use env values when set', () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.OPENAI_MODEL = 'gpt-4o';

      const config = openaiConfig() as any;
      expect(config.apiKey).toBe('sk-test');
      expect(config.model).toBe('gpt-4o');
    });

    it('should default model to gpt-4o-mini', () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;

      const config = openaiConfig() as any;
      expect(config.apiKey).toBe('');
      expect(config.model).toBe('gpt-4o-mini');
    });
  });

  describe('mailConfig', () => {
    it('should use env values when set', () => {
      process.env.MAIL_HOST = 'smtp.mailgun.org';
      process.env.MAIL_PORT = '2525';
      process.env.MAIL_USERNAME = 'user';
      process.env.MAIL_PASSWORD = 'pass';
      process.env.MAIL_FROM_NAME = 'MyApp';

      const config = mailConfig() as any;
      expect(config.host).toBe('smtp.mailgun.org');
      expect(config.port).toBe(2525);
      expect(config.user).toBe('user');
      expect(config.pass).toBe('pass');
      expect(config.fromName).toBe('MyApp');
    });

    it('should use gmail defaults', () => {
      delete process.env.MAIL_HOST;
      delete process.env.MAIL_PORT;
      delete process.env.MAIL_FROM_NAME;

      const config = mailConfig() as any;
      expect(config.host).toBe('smtp.gmail.com');
      expect(config.port).toBe(587);
      expect(config.fromName).toBe('Renjana');
    });
  });

  describe('throttleConfig', () => {
    it('should use env values when set', () => {
      process.env.THROTTLE_TTL = '30000';
      process.env.THROTTLE_LIMIT = '50';

      const config = throttleConfig() as any;
      expect(config.ttl).toBe(30000);
      expect(config.limit).toBe(50);
    });

    it('should use defaults', () => {
      delete process.env.THROTTLE_TTL;
      delete process.env.THROTTLE_LIMIT;

      const config = throttleConfig() as any;
      expect(config.ttl).toBe(60000);
      expect(config.limit).toBe(100);
    });
  });
});