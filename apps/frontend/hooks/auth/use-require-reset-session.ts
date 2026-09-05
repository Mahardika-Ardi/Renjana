'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { session } from '@renjana/utils';
import {
  RESET_TOKEN_KEY,
  RESET_EMAIL_KEY,
} from '@/lib/constants/reset-password';

const noopSubscribe = () => () => {};

function getSnapshot(): boolean {
  const token = session.get(RESET_TOKEN_KEY);
  const email = session.get(RESET_EMAIL_KEY);
  return Boolean(token && email);
}

function getServerSnapshot(): boolean {
  return false;
}

interface UseRequireResetSessionResult {
  isValid: boolean;
}

export function useRequireResetSession(
  redirectTo: string = '/forgot-password',
): UseRequireResetSessionResult {
  const router = useRouter();
  const isValid = useSyncExternalStore(
    noopSubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (!isValid) {
      router.replace(redirectTo);
    }
  });

  return { isValid };
}
