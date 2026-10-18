'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { cacheInvalidate, cacheKeys } from '@/lib/api/cache';
import type {
  AuthUser,
  InviteResponse,
  ValidateInviteResponse,
} from '@renjana/types';

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/* Couple invite flow: generate a link, validate a token (public), accept it.
 * Accepting invalidates the cached profile so couple slots update instantly.
 */
export function useInvite() {
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (): Promise<InviteResponse | null> => {
    if (generating) return null;
    setGenerating(true);
    setError(null);
    try {
      const res = await authApi.invite();
      return res.data as unknown as InviteResponse;
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal membuat tautan undangan.'));
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const validate = async (
    token: string,
  ): Promise<ValidateInviteResponse | null> => {
    setError(null);
    try {
      const res = await authApi.validateInvite(token);
      return res.data as unknown as ValidateInviteResponse;
    } catch (err) {
      setError(toErrorMessage(err, 'Tautan undangan tidak valid.'));
      return null;
    }
  };

  const accept = async (token: string): Promise<AuthUser | null> => {
    if (accepting) return null;
    setAccepting(true);
    setError(null);
    try {
      const res = await authApi.acceptInvite({ token });
      const user = res.data as unknown as AuthUser;
      cacheInvalidate(cacheKeys.me);
      return user;
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal menerima undangan.'));
      return null;
    } finally {
      setAccepting(false);
    }
  };

  return {
    generating,
    accepting,
    error,
    generate,
    validate,
    accept,
    dismissError: () => setError(null),
  };
}
