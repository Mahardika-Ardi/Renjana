import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;

  constructor(private config: ConfigService) {
    this.initClients();
  }

  private initClients() {
    const url = this.config.get<string>('supabase.url');
    const anonKey = this.config.get<string>('supabase.anonKey');
    const serviceKey = this.config.get<string>('supabase.serviceRoleKey');

    const isValidUrl = url && url.startsWith('http');
    const isValidAnon = anonKey && !anonKey.includes('your-supabase');
    const isValidService = serviceKey && !serviceKey.includes('your-supabase');

    if (isValidUrl && isValidAnon) {
      this.client = createClient(url, anonKey, {
        auth: { persistSession: false },
      });
      this.logger.log('Supabase Client (Anon) initialized successfully');
    } else {
      this.logger.warn(
        'Supabase URL/Anon Key belum di-config dengan benar di .env',
      );
    }

    if (isValidUrl && isValidService) {
      this.adminClient = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      this.logger.log('Supabase Admin Client (Service Role) initialized successfully');
    } else {
      this.logger.warn(
        'Supabase Service Role Key belum di-config dengan benar di .env',
      );
    }
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      const url = this.config.get<string>('supabase.url') || 'https://placeholder.supabase.co';
      const anonKey = this.config.get<string>('supabase.anonKey') || 'placeholder-anon-key';
      return createClient(url, anonKey, { auth: { persistSession: false } });
    }
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      const url = this.config.get<string>('supabase.url') || 'https://placeholder.supabase.co';
      const serviceKey = this.config.get<string>('supabase.serviceRoleKey') || 'placeholder-service-key';
      return createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.adminClient;
  }
}
